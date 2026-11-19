# Nav Battles

This is a stronghold locator tool made to be used with MCSR Ranked's on world join commands, as well as in singleplayer worlds. Some functionality copied over from MPK but altered to be able to be compatible with Ranked's way of running commands.

The tool locates the stronghold, puts the players in the starter staircase (facing towards the 5-way), and gives them items.

## How to use

The minecraft commands are in `nav_battles.mcfunction`, and the builder script is `build.py`

```bash
python3 build.py                     # creates the one-line command into ranked.txt
python3 build.py --copy              # + copies ranked.txt to the clipboard
python3 build.py --datapack          # + puts it as a datapack in the most recent singleplayer world
python3 build.py --datapack "PATH"   # + places the datapack in the provided world folder
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
replaceitem entity @s hotbar.0 minecraft:ender_eye 12
replaceitem entity @s hotbar.1 minecraft:soul_sand 64
replaceitem entity @s weapon.offhand minecraft:bread 12

# ==============================
```

After editing the file, rerun the desired build command.
