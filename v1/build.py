import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

root = Path(__file__).parent
source = root / "nav_battles.mcfunction"
default_saves_file = root / "default_saves.txt" # --save-default saves into here


def newest_new_world(saves):
    best, best_number = None, -1
    for world in saves.iterdir():
        match = re.fullmatch(r"New World(?: \((\d+)\))?", world.name)
        if world.is_dir() and match:
            number = int(match.group(1) or 0)
            if number > best_number:
                best, best_number = world, number
    if best is None:
        raise SystemExit(f'No "New World" folder in {saves}')
    return best


parser = argparse.ArgumentParser()
parser.add_argument("--copy", action="store_true", help="copy ranked.txt to the clipboard")
parser.add_argument(
    "--datapack",
    nargs="?",
    const="default",
    metavar="PATH",
    help="copy the datapack into a world, no PATH defaults to the configured saves folder",
)
parser.add_argument(
    "--save-default", action="store_true", help="save the instance of --datapack PATH"
)
args = parser.parse_args()

# Skip comments and empty lines
commands = []
for line in source.read_text().splitlines():
    line = line.strip()
    if line == "" or line.startswith("#"):
        continue
    # Ranked cuts the field at every ";" so can't include it in the commands
    if ";" in line:
        raise SystemExit(f'Commands can\'t include a ";":\n{line}')
    commands.append(line)

# Every line, separated by ";", at most 32500 characters.
one_line = ";".join(commands)
if len(one_line) > 32500:
    raise SystemExit(f"Too long for Ranked: {len(one_line)} characters (max 32500)")
(root / "ranked.txt").write_text(one_line)
print(f"ranked.txt: {len(commands)} commands, {len(one_line)} / 32500 characters")


if args.copy:
    if sys.platform == "win32":
        tools = [["clip"]]
    elif sys.platform == "darwin":
        tools = [["pbcopy"]]
    else:
        tools = [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]]
    tool = next((t for t in tools if shutil.which(t[0])), None)
    if tool is None:
        raise SystemExit("No clipboard command found, copy ranked.txt manually")
    subprocess.run(tool, input=one_line.encode(), check=True)
    print("ranked.txt copied to the clipboard")

if args.save_default and args.datapack in (None, "default"):
    raise SystemExit('--save-default needs a path: --datapack "PATH" --save-default')

if args.datapack:
    # Find the world. PATH can be a world or a saves folder.
    if args.datapack == "default":
        if not default_saves_file.is_file():
            raise SystemExit('Default saves folder not configured: --datapack "PATH" --save-default')
        saves = Path(default_saves_file.read_text().strip())
        world = newest_new_world(saves)
    else:
        path = Path(args.datapack).expanduser().resolve()
        if (path / "level.dat").is_file():
            world, saves = path, path.parent
        else:
            world, saves = newest_new_world(path), path

    if args.save_default:
        default_saves_file.write_text(f"{saves}\n")
        print(f"default saves folder: {saves}")

    # Place datapack into the world, remove old copies:
    #   datapacks/nav_battles/pack.mcmeta
    #   datapacks/nav_battles/data/nav_battles/functions/start.mcfunction
    target = world / "datapacks" / "nav_battles"
    if target.exists():
        shutil.rmtree(target)

    function = target / "data" / "nav_battles" / "functions" / "start.mcfunction"
    function.parent.mkdir(parents=True)
    shutil.copyfile(source, function)
    (target / "pack.mcmeta").write_text(
        '{"pack": {"pack_format": 5, "description": "Nav Battles"}}\n'
    )

    print(f"datapack copied to {target}  (in game: /reload, then /function nav_battles:start)")
