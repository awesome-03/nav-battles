# Puts every player at the bottom of the starter staircase
# Facing the 5way, with 12 eyes, 64 soul sand and 12 bread in offhand.

gamerule sendCommandFeedback false
execute as @s run scoreboard objectives add nb dummy
scoreboard players set #16 nb 16
scoreboard players set #400 nb 400

# ----- Finding the sh -----

# locate from fixed coords
execute store result score #d0 nb positioned 0 0 2048 run locate stronghold
execute store result score #d1 nb positioned -1024 0 1773 run locate stronghold
execute store result score #d2 nb positioned -1774 0 1024 run locate stronghold
execute store result score #d3 nb positioned -2048 0 0 run locate stronghold
execute store result score #d4 nb positioned -1774 0 -1024 run locate stronghold

# measure from the closest point
scoreboard players operation #D nb = #d0 nb
scoreboard players operation #D nb < #d1 nb
scoreboard players operation #D nb < #d2 nb
scoreboard players operation #D nb < #d3 nb
scoreboard players operation #D nb < #d4 nb

# locate from 200 blocks east and south of the point
execute if score #D nb = #d4 nb run scoreboard players set #x nb -1774
execute if score #D nb = #d4 nb run scoreboard players set #z nb -1024
execute if score #D nb = #d4 nb store result score #E nb positioned -1574 0 -1024 run locate stronghold
execute if score #D nb = #d4 nb store result score #S nb positioned -1774 0 -824 run locate stronghold
execute if score #D nb = #d3 nb run scoreboard players set #x nb -2048
execute if score #D nb = #d3 nb run scoreboard players set #z nb 0
execute if score #D nb = #d3 nb store result score #E nb positioned -1848 0 0 run locate stronghold
execute if score #D nb = #d3 nb store result score #S nb positioned -2048 0 200 run locate stronghold
execute if score #D nb = #d2 nb run scoreboard players set #x nb -1774
execute if score #D nb = #d2 nb run scoreboard players set #z nb 1024
execute if score #D nb = #d2 nb store result score #E nb positioned -1574 0 1024 run locate stronghold
execute if score #D nb = #d2 nb store result score #S nb positioned -1774 0 1224 run locate stronghold
execute if score #D nb = #d1 nb run scoreboard players set #x nb -1024
execute if score #D nb = #d1 nb run scoreboard players set #z nb 1773
execute if score #D nb = #d1 nb store result score #E nb positioned -824 0 1773 run locate stronghold
execute if score #D nb = #d1 nb store result score #S nb positioned -1024 0 1973 run locate stronghold
execute if score #D nb = #d0 nb run scoreboard players set #x nb 0
execute if score #D nb = #d0 nb run scoreboard players set #z nb 2048
execute if score #D nb = #d0 nb store result score #E nb positioned 200 0 2048 run locate stronghold
execute if score #D nb = #d0 nb store result score #S nb positioned 0 0 2248 run locate stronghold

# find how far the sh is
scoreboard players operation #D nb *= #D nb
scoreboard players operation #E nb *= #E nb
scoreboard players operation #S nb *= #S nb
scoreboard players operation #E nb -= #D nb
scoreboard players remove #E nb 40000
scoreboard players operation #E nb /= #400 nb
scoreboard players operation #S nb -= #D nb
scoreboard players remove #S nb 40000
scoreboard players operation #S nb /= #400 nb

# chunk coords = (coords - offset) / 16
scoreboard players operation #x nb -= #E nb
scoreboard players operation #z nb -= #S nb
scoreboard players operation #x nb /= #16 nb
scoreboard players operation #z nb /= #16 nb

# ----- Finding starter -----

# spawn the armor stands
summon armor_stand ~ ~ ~ {Tags:["nb","nb_x","nb_1"],Rotation:[-90f,0f],Marker:1b,Invisible:1b,NoGravity:1b}
summon armor_stand ~ ~ ~ {Tags:["nb","nb_z","nb_1"],Rotation:[0f,0f],Marker:1b,Invisible:1b,NoGravity:1b}
summon armor_stand ~ ~ ~ {Tags:["nb","nb_x","nb_z"],Rotation:[0f,-90f],Marker:1b,Invisible:1b,NoGravity:1b}
scoreboard players set @e[tag=nb_1] nb 1
scoreboard players set @e[tag=nb_x,tag=nb_z] nb 0

# split the chunk coords into bits
scoreboard players add #x nb 256
scoreboard players add #z nb 256
execute as @s store success score #x8 nb if score #x nb matches 256..
execute if score #x8 nb matches 1 run scoreboard players remove #x nb 256
execute as @s store success score #x7 nb if score #x nb matches 128..
execute if score #x7 nb matches 1 run scoreboard players remove #x nb 128
execute as @s store success score #x6 nb if score #x nb matches 64..
execute if score #x6 nb matches 1 run scoreboard players remove #x nb 64
execute as @s store success score #x5 nb if score #x nb matches 32..
execute if score #x5 nb matches 1 run scoreboard players remove #x nb 32
execute as @s store success score #x4 nb if score #x nb matches 16..
execute if score #x4 nb matches 1 run scoreboard players remove #x nb 16
execute as @s store success score #x3 nb if score #x nb matches 8..
execute if score #x3 nb matches 1 run scoreboard players remove #x nb 8
execute as @s store success score #x2 nb if score #x nb matches 4..
execute if score #x2 nb matches 1 run scoreboard players remove #x nb 4
execute as @s store success score #x1 nb if score #x nb matches 2..
execute if score #x1 nb matches 1 run scoreboard players remove #x nb 2
execute as @s store success score #x0 nb if score #x nb matches 1..
execute as @s store success score #z8 nb if score #z nb matches 256..
execute if score #z8 nb matches 1 run scoreboard players remove #z nb 256
execute as @s store success score #z7 nb if score #z nb matches 128..
execute if score #z7 nb matches 1 run scoreboard players remove #z nb 128
execute as @s store success score #z6 nb if score #z nb matches 64..
execute if score #z6 nb matches 1 run scoreboard players remove #z nb 64
execute as @s store success score #z5 nb if score #z nb matches 32..
execute if score #z5 nb matches 1 run scoreboard players remove #z nb 32
execute as @s store success score #z4 nb if score #z nb matches 16..
execute if score #z4 nb matches 1 run scoreboard players remove #z nb 16
execute as @s store success score #z3 nb if score #z nb matches 8..
execute if score #z3 nb matches 1 run scoreboard players remove #z nb 8
execute as @s store success score #z2 nb if score #z nb matches 4..
execute if score #z2 nb matches 1 run scoreboard players remove #z nb 4
execute as @s store success score #z1 nb if score #z nb matches 2..
execute if score #z1 nb matches 1 run scoreboard players remove #z nb 2
execute as @s store success score #z0 nb if score #z nb matches 1..

# load the chunk
execute positioned -4091.5 0 -4091.5 as @e[tag=nb_x] if score @s nb = #x8 nb rotated as @s positioned ^ ^ ^4096 as @e[tag=nb_x] if score @s nb = #x7 nb rotated as @s positioned ^ ^ ^2048 as @e[tag=nb_x] if score @s nb = #x6 nb rotated as @s positioned ^ ^ ^1024 as @e[tag=nb_x] if score @s nb = #x5 nb rotated as @s positioned ^ ^ ^512 as @e[tag=nb_x] if score @s nb = #x4 nb rotated as @s positioned ^ ^ ^256 as @e[tag=nb_x] if score @s nb = #x3 nb rotated as @s positioned ^ ^ ^128 as @e[tag=nb_x] if score @s nb = #x2 nb rotated as @s positioned ^ ^ ^64 as @e[tag=nb_x] if score @s nb = #x1 nb rotated as @s positioned ^ ^ ^32 as @e[tag=nb_x] if score @s nb = #x0 nb rotated as @s positioned ^ ^ ^16 as @e[tag=nb_z] if score @s nb = #z8 nb rotated as @s positioned ^ ^ ^4096 as @e[tag=nb_z] if score @s nb = #z7 nb rotated as @s positioned ^ ^ ^2048 as @e[tag=nb_z] if score @s nb = #z6 nb rotated as @s positioned ^ ^ ^1024 as @e[tag=nb_z] if score @s nb = #z5 nb rotated as @s positioned ^ ^ ^512 as @e[tag=nb_z] if score @s nb = #z4 nb rotated as @s positioned ^ ^ ^256 as @e[tag=nb_z] if score @s nb = #z3 nb rotated as @s positioned ^ ^ ^128 as @e[tag=nb_z] if score @s nb = #z2 nb rotated as @s positioned ^ ^ ^64 as @e[tag=nb_z] if score @s nb = #z1 nb rotated as @s positioned ^ ^ ^32 as @e[tag=nb_z] if score @s nb = #z0 nb rotated as @s positioned ^ ^ ^16 run spreadplayers ~ ~ 0 1 under 0 false @s
# place the armor stand at y=1
execute positioned -4091.5 0 -4091.5 as @e[tag=nb_x] if score @s nb = #x8 nb rotated as @s positioned ^ ^ ^4096 as @e[tag=nb_x] if score @s nb = #x7 nb rotated as @s positioned ^ ^ ^2048 as @e[tag=nb_x] if score @s nb = #x6 nb rotated as @s positioned ^ ^ ^1024 as @e[tag=nb_x] if score @s nb = #x5 nb rotated as @s positioned ^ ^ ^512 as @e[tag=nb_x] if score @s nb = #x4 nb rotated as @s positioned ^ ^ ^256 as @e[tag=nb_x] if score @s nb = #x3 nb rotated as @s positioned ^ ^ ^128 as @e[tag=nb_x] if score @s nb = #x2 nb rotated as @s positioned ^ ^ ^64 as @e[tag=nb_x] if score @s nb = #x1 nb rotated as @s positioned ^ ^ ^32 as @e[tag=nb_x] if score @s nb = #x0 nb rotated as @s positioned ^ ^ ^16 as @e[tag=nb_z] if score @s nb = #z8 nb rotated as @s positioned ^ ^ ^4096 as @e[tag=nb_z] if score @s nb = #z7 nb rotated as @s positioned ^ ^ ^2048 as @e[tag=nb_z] if score @s nb = #z6 nb rotated as @s positioned ^ ^ ^1024 as @e[tag=nb_z] if score @s nb = #z5 nb rotated as @s positioned ^ ^ ^512 as @e[tag=nb_z] if score @s nb = #z4 nb rotated as @s positioned ^ ^ ^256 as @e[tag=nb_z] if score @s nb = #z3 nb rotated as @s positioned ^ ^ ^128 as @e[tag=nb_z] if score @s nb = #z2 nb rotated as @s positioned ^ ^ ^64 as @e[tag=nb_z] if score @s nb = #z1 nb rotated as @s positioned ^ ^ ^32 as @e[tag=nb_z] if score @s nb = #z0 nb rotated as @s positioned ^ ^ ^16 run summon armor_stand ~ 1 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}

# ----- Finding starter's floor -----

# stack 64 armor stands in the column
execute as @e[tag=nb_c] at @s run summon armor_stand ~ ~1 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}
execute as @e[tag=nb_c] at @s run summon armor_stand ~ ~2 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}
execute as @e[tag=nb_c] at @s run summon armor_stand ~ ~4 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}
execute as @e[tag=nb_c] at @s run summon armor_stand ~ ~8 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}
execute as @e[tag=nb_c] at @s run summon armor_stand ~ ~16 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}
execute as @e[tag=nb_c] at @s run summon armor_stand ~ ~32 ~ {Tags:["nb","nb_c"],Marker:1b,Invisible:1b,NoGravity:1b}

# Find the facing direction using smoothstone slabs:
# south
execute as @e[tag=nb_c] at @s rotated 0 0 if block ^-1 ^ ^1 smooth_stone_slab if block ^-1 ^1 ^-1 smooth_stone_slab if block ^1 ^2 ^-1 smooth_stone_slab if block ^1 ^3 ^1 smooth_stone_slab if block ^-1 ^4 ^1 smooth_stone_slab if block ^-1 ^5 ^-1 smooth_stone_slab run data merge entity @s {Tags:["nb","nb_hit"],Rotation:[0f,0f]}
# west
execute as @e[tag=nb_c] at @s rotated 90 0 if block ^-1 ^ ^1 smooth_stone_slab if block ^-1 ^1 ^-1 smooth_stone_slab if block ^1 ^2 ^-1 smooth_stone_slab if block ^1 ^3 ^1 smooth_stone_slab if block ^-1 ^4 ^1 smooth_stone_slab if block ^-1 ^5 ^-1 smooth_stone_slab run data merge entity @s {Tags:["nb","nb_hit"],Rotation:[90f,0f]}
# north
execute as @e[tag=nb_c] at @s rotated 180 0 if block ^1 ^ ^1 smooth_stone_slab if block ^1 ^1 ^-1 smooth_stone_slab if block ^-1 ^2 ^-1 smooth_stone_slab if block ^-1 ^3 ^1 smooth_stone_slab if block ^1 ^4 ^1 smooth_stone_slab if block ^1 ^5 ^-1 smooth_stone_slab run data merge entity @s {Tags:["nb","nb_hit"],Rotation:[180f,0f]}
# east
execute as @e[tag=nb_c] at @s rotated -90 0 if block ^1 ^ ^1 smooth_stone_slab if block ^1 ^1 ^-1 smooth_stone_slab if block ^-1 ^2 ^-1 smooth_stone_slab if block ^-1 ^3 ^1 smooth_stone_slab if block ^1 ^4 ^1 smooth_stone_slab if block ^1 ^5 ^-1 smooth_stone_slab run data merge entity @s {Tags:["nb","nb_hit"],Rotation:[-90f,0f]}

# Use the highest match, in case another staircase happens to sit below.
execute at @e[tag=nb_c,limit=1] positioned ~ 255 ~ run tag @e[tag=nb_hit,sort=nearest,limit=1] add nb_top

# -- Teleport

# fill the air gaps at the bottom of starter
execute at @e[tag=nb_top] run fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 stone_bricks replace cave_air
execute at @e[tag=nb_top] run fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 stone_bricks replace air

# tp player
execute at @e[tag=nb_top] run tp @s ^ ^ ^0 ~ ~
execute unless entity @e[tag=nb_top] run tellraw @s {"text":"[Nav Battles]: Starter staircase not found","color":"red"}

# ==============================

# INVENTORY

# To customize the slots:
# Hotbar namings: hotbar.0 to hotbar.8
# Inventory namings: inventory.0 to inventory.26, weapon.offhand,
# Armor namings: armor.head, armor.chest, armor.legs, armor.feet

execute as @s run clear @s
replaceitem entity @s hotbar.0 minecraft:ender_eye 12
replaceitem entity @s hotbar.1 minecraft:soul_sand 64
replaceitem entity @s weapon.offhand minecraft:bread 12

# ==============================

# cleanup
execute as @s run kill @e[tag=nb]
scoreboard objectives remove nb
