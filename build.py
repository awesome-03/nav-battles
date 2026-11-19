#!/usr/bin/env python3
#   python3 build.py                     build the command into ranked.txt
#   python3 build.py --copy              copy ranked.txt to the clipboard
#   python3 build.py --datapack          copy the datapack into the newest "New World (N)" world in saves/
#   python3 build.py --datapack "PATH"   copy the datapack into the world at PATH

import argparse
import re
import shutil
import subprocess
from pathlib import Path

# Default saves folder
SAVES = Path("/home/awesome/.local/share/PrismLauncher/instances/MCSR Ranked/minecraft/saves")

root = Path(__file__).parent
source = root / "nav_battles.mcfunction"


def newest_new_world():
    best, best_number = None, -1
    for world in SAVES.iterdir():
        match = re.fullmatch(r"New World(?: \((\d+)\))?", world.name)
        if world.is_dir() and match:
            number = int(match.group(1) or 0)
            if number > best_number:
                best, best_number = world, number
    if best is None:
        raise SystemExit(f'No "New World" folder in {SAVES}')
    return best


parser = argparse.ArgumentParser()
parser.add_argument("--copy", action="store_true", help="copy ranked.txt to the clipboard")
parser.add_argument(
    "--datapack",
    nargs="?",
    const="newest",
    metavar="WORLD",
    help="copy the datapack into WORLD, or the newest New World in SAVES",
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
    # Wayland clipboard
    subprocess.run(["wl-copy"], input=one_line.encode(), check=True)
    print("ranked.txt copied to the clipboard")

if args.datapack:
    # Place datapack into the world, remove old copies:
    #   datapacks/nav_battles/pack.mcmeta
    #   datapacks/nav_battles/data/nav_battles/functions/start.mcfunction

    world = (
        newest_new_world()
        if args.datapack == "newest"
        else Path(args.datapack).expanduser()
    )
    if not (world / "level.dat").is_file():
        raise SystemExit(f"{world} isn't a world folder (no level.dat)")

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
