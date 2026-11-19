# Nav Battles

This is a stronghold locator tool made to be used with MCSR Ranked's on world join commands, as well as in singleplayer worlds. Some functionality copied over from MPK but altered to be able to be compatible with Ranked's way of running commands.

The tool locates the stronghold, puts the players in the starter staircase (facing towards the 5-way), and gives them items.

## How to use

If you just want to use the tool without downloading the script:

1. Copy the text in `ranked.txt`
2. In a ranked private room: Options -> Miscellaneous
3. Find the "Run Command on World Join" field and paste the commands in it.

The default items are set to: Iron pickaxe, 64 soul sand, 12 eyes of ender, and 12 bread in offhand

### The script

The minecraft commands are in `nav_battles.mcfunction`, and the builder script is `build.py`

```bash
python3 build.py                                   # creates the one-line command into ranked.txt
python3 build.py --copy                            # + copies ranked.txt to the clipboard
python3 build.py --datapack "PATH"                 # + places the datapack in the provided world folder
python3 build.py --datapack "PATH" --save-default  # + configures the default saves folder
python3 build.py --datapack                        # + uses the configured saves folder
```

The datapack defaults to search for `New World (X)` so if you use another language it won't work.

To use the datapack: `/reload`, then `/function nav_battles:start`

## Editing the datapack

I commented out some things but possibly the most useful one is the inventory, which can be customized in the inventory section of `nav_battles.mcfunction`.

```text
# ==============================

# INVENTORY

# To customize the slots:
# Hotbar slots: hotbar.0 to hotbar.8, and weapon.offhand
# Inventory slots: inventory.0 to inventory.26
# Armor slots: armor.head, armor.chest, armor.legs, armor.feet

# replaceitem entity @s <Slot Name> <Item Name> <Item Count>

execute as @s run clear @s
replaceitem entity @s hotbar.0 minecraft:iron_pickaxe 1
replaceitem entity @s hotbar.1 minecraft:soul_sand 64
replaceitem entity @s hotbar.2 minecraft:ender_eye 12
replaceitem entity @s weapon.offhand minecraft:bread 12

# ==============================
```

After editing the file, rerun the desired build command.
