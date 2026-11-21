gamerule sendCommandFeedback false
scoreboard objectives add n dummy
scoreboard players set 400 n 400
scoreboard players set 256 n 256
scoreboard players set 128 n 128
scoreboard players set 64 n 64
scoreboard players set 32 n 32
scoreboard players set 16 n 16
scoreboard players set 8 n 8
scoreboard players set 4 n 4
scoreboard players set 2 n 2

# ----- Finding the sh -----

# locate from fixed coords, the first one also starts the closest distance D
execute store result score a n store result score D n positioned 0 0 2048 run locate stronghold
execute store result score b n positioned -1024 0 1773 run locate stronghold
execute store result score c n positioned -1774 0 1024 run locate stronghold
execute store result score d n positioned -2048 0 0 run locate stronghold
execute store result score e n positioned -1774 0 -1024 run locate stronghold

# measure from the closest point
scoreboard players operation D n < b n
scoreboard players operation D n < c n
scoreboard players operation D n < d n
scoreboard players operation D n < e n

# locate from 200 blocks east and south of the point
# x and z are the point's coords + 4096, so after / 16 they come out as chunk + 256, ready to split into bits
execute if score D n = e n run scoreboard players set x n 2322
execute if score D n = e n run scoreboard players set z n 3072
execute if score D n = e n store result score E n positioned -1574 0 -1024 run locate stronghold
execute if score D n = e n store result score S n positioned -1774 0 -824 run locate stronghold
execute if score D n = d n run scoreboard players set x n 2048
execute if score D n = d n run scoreboard players set z n 4096
execute if score D n = d n store result score E n positioned -1848 0 0 run locate stronghold
execute if score D n = d n store result score S n positioned -2048 0 200 run locate stronghold
execute if score D n = c n run scoreboard players set x n 2322
execute if score D n = c n run scoreboard players set z n 5120
execute if score D n = c n store result score E n positioned -1574 0 1024 run locate stronghold
execute if score D n = c n store result score S n positioned -1774 0 1224 run locate stronghold
execute if score D n = b n run scoreboard players set x n 3072
execute if score D n = b n run scoreboard players set z n 5869
execute if score D n = b n store result score E n positioned -824 0 1773 run locate stronghold
execute if score D n = b n store result score S n positioned -1024 0 1973 run locate stronghold
execute if score D n = a n run scoreboard players set x n 4096
execute if score D n = a n run scoreboard players set z n 6144
execute if score D n = a n store result score E n positioned 200 0 2048 run locate stronghold
execute if score D n = a n store result score S n positioned 0 0 2248 run locate stronghold

# find how far the sh is: E = (E² - D² - 40000) / 400, same for S
scoreboard players operation D n *= D n
scoreboard players add D n 40000
scoreboard players operation E n *= E n
scoreboard players operation S n *= S n
scoreboard players operation E n -= D n
scoreboard players operation E n /= 400 n
scoreboard players operation S n -= D n
scoreboard players operation S n /= 400 n

# chunk coords + 256 = (coords + 4096 - offset) / 16
scoreboard players operation x n -= E n
scoreboard players operation z n -= S n
scoreboard players operation x n /= 16 n
scoreboard players operation z n /= 16 n

# ----- Finding starter -----

# spawn the armor stands that steer the walk: x faces east, z faces south, the x+z one faces up (score 0)
summon armor_stand ~ ~ ~ {Tags:[x],Rotation:[-90f],Invisible:1b}
summon armor_stand ~ ~ ~ {Tags:[z],Invisible:1b}
summon armor_stand ~ ~ ~ {Tags:[x,z],Rotation:[0f,-90f],Invisible:1b}
scoreboard players set @e[type=armor_stand] n 1
scoreboard players set @e[tag=x,tag=z] n 0

# split the chunk coords into bits: xk = 1 if x has 2^k left, then x %= 2^k
execute as @s store result score x8 n if score x n matches 256..
scoreboard players operation x n %= 256 n
execute as @s store result score x7 n if score x n matches 128..
scoreboard players operation x n %= 128 n
execute as @s store result score x6 n if score x n matches 64..
scoreboard players operation x n %= 64 n
execute as @s store result score x5 n if score x n matches 32..
scoreboard players operation x n %= 32 n
execute as @s store result score x4 n if score x n matches 16..
scoreboard players operation x n %= 16 n
execute as @s store result score x3 n if score x n matches 8..
scoreboard players operation x n %= 8 n
execute as @s store result score x2 n if score x n matches 4..
scoreboard players operation x n %= 4 n
execute as @s store result score x1 n if score x n matches 2..
scoreboard players operation x n %= 2 n
execute as @s store result score x0 n if score x n matches 1..
execute as @s store result score z8 n if score z n matches 256..
scoreboard players operation z n %= 256 n
execute as @s store result score z7 n if score z n matches 128..
scoreboard players operation z n %= 128 n
execute as @s store result score z6 n if score z n matches 64..
scoreboard players operation z n %= 64 n
execute as @s store result score z5 n if score z n matches 32..
scoreboard players operation z n %= 32 n
execute as @s store result score z4 n if score z n matches 16..
scoreboard players operation z n %= 16 n
execute as @s store result score z3 n if score z n matches 8..
scoreboard players operation z n %= 8 n
execute as @s store result score z2 n if score z n matches 4..
scoreboard players operation z n %= 4 n
execute as @s store result score z1 n if score z n matches 2..
scoreboard players operation z n %= 2 n
execute as @s store result score z0 n if score z n matches 1..

# walk to the chunk and put the player there for a moment (only the player can be found in an unloaded chunk)
execute positioned -4091.5 0 -4091.5 as @e[tag=x] if score @s n = x8 n rotated as @s positioned ^ ^ ^4096 as @e[tag=x] if score @s n = x7 n rotated as @s positioned ^ ^ ^2048 as @e[tag=x] if score @s n = x6 n rotated as @s positioned ^ ^ ^1024 as @e[tag=x] if score @s n = x5 n rotated as @s positioned ^ ^ ^512 as @e[tag=x] if score @s n = x4 n rotated as @s positioned ^ ^ ^256 as @e[tag=x] if score @s n = x3 n rotated as @s positioned ^ ^ ^128 as @e[tag=x] if score @s n = x2 n rotated as @s positioned ^ ^ ^64 as @e[tag=x] if score @s n = x1 n rotated as @s positioned ^ ^ ^32 as @e[tag=x] if score @s n = x0 n rotated as @s positioned ^ ^ ^16 as @e[tag=z] if score @s n = z8 n rotated as @s positioned ^ ^ ^4096 as @e[tag=z] if score @s n = z7 n rotated as @s positioned ^ ^ ^2048 as @e[tag=z] if score @s n = z6 n rotated as @s positioned ^ ^ ^1024 as @e[tag=z] if score @s n = z5 n rotated as @s positioned ^ ^ ^512 as @e[tag=z] if score @s n = z4 n rotated as @s positioned ^ ^ ^256 as @e[tag=z] if score @s n = z3 n rotated as @s positioned ^ ^ ^128 as @e[tag=z] if score @s n = z2 n rotated as @s positioned ^ ^ ^64 as @e[tag=z] if score @s n = z1 n rotated as @s positioned ^ ^ ^32 as @e[tag=z] if score @s n = z0 n rotated as @s positioned ^ ^ ^16 run tp @p ~ 1 ~
# load the chunk (spreadplayers under 0 always fails, but reads the blocks first) and place the column's first stand
execute at @s run spreadplayers ~ ~ 0 1 under 0 false @s
execute at @s run summon armor_stand ~ ~ ~ {Tags:[c,p],Invisible:1b}

# ----- Finding starter's floor -----

# stack 64 armor stands in the column, all facing south
execute at @e[tag=c] run summon armor_stand ~ ~1 ~ {Tags:[c,p],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~2 ~ {Tags:[c,p],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~4 ~ {Tags:[c,p],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~8 ~ {Tags:[c,p],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~16 ~ {Tags:[c,p],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~32 ~ {Tags:[c,p],Invisible:1b}

# a stand facing west, north and east next to every south facing one, made in that order so a tie still goes south, west, north, east
execute at @e[tag=c] run summon armor_stand ~ ~ ~ {Tags:[p],Rotation:[90f],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~ ~ {Tags:[q],Rotation:[180f],Invisible:1b}
execute at @e[tag=c] run summon armor_stand ~ ~ ~ {Tags:[q],Rotation:[-90f],Invisible:1b}

# Find the facing direction using smoothstone slabs, each stand checks in the direction it faces:
# south and west
execute as @e[tag=p] at @s if block ^-1 ^ ^1 smooth_stone_slab if block ^-1 ^1 ^-1 smooth_stone_slab if block ^1 ^2 ^-1 smooth_stone_slab if block ^1 ^3 ^1 smooth_stone_slab if block ^-1 ^4 ^1 smooth_stone_slab if block ^-1 ^5 ^-1 smooth_stone_slab run tag @s add h
# north and east
execute as @e[tag=q] at @s if block ^1 ^ ^1 smooth_stone_slab if block ^1 ^1 ^-1 smooth_stone_slab if block ^-1 ^2 ^-1 smooth_stone_slab if block ^-1 ^3 ^1 smooth_stone_slab if block ^1 ^4 ^1 smooth_stone_slab if block ^1 ^5 ^-1 smooth_stone_slab run tag @s add h

# Use the highest match, in case another staircase happens to sit below.
execute at @e[tag=c,limit=1] positioned ~ 255 ~ run tag @e[tag=h,sort=nearest,limit=1] add t

# -- Teleport

# fill the air gaps at the bottom of starter (keep = only air and cave air)
execute at @e[tag=t] run fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 stone_bricks keep

# tp player, or put them back where they were if starter wasn't found
execute at @e[tag=t] run tp @s ~ ~ ~ ~ ~
execute unless entity @e[tag=t] at @e[tag=z,limit=1] run tp @s ~ ~ ~
execute unless entity @e[tag=t] run tellraw @s {"text":"[Nav Battles]: Starter staircase not found","color":"red"}

# ==============================

# INVENTORY

# The site puts the room's inventories right after this line.

execute as @s run clear @s

# ==============================

# cleanup
kill @e[type=armor_stand]
scoreboard objectives remove n
