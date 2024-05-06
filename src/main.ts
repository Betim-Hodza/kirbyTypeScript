import { makeBirbEnemy, makeBurnyEnemy, makePlayer, makeScaredyEnemy, setControls } from "./entities";
import { k } from "./kaboomCtx";
import { makeMap } from "./utils";

async function gameSetup() {
    k.loadSprite("assets", "./kirby-like.png", {
        sliceX: 9,
        sliceY: 10,
        anims: {
            kirbIdle: 0,
            kirbInhaling: 1,
            kirbFull: 2,
            kirbyInhaleEffect: { from: 3, to: 8, speed: 15, loop: true },
            shootingStar: 9,
            burny: { from: 36, to : 37, speed: 4, loop: true },
            scaredyIdle: 18,
            scaredyWalk: { from: 18, to: 19, speed: 4, loop: true },
            birb: { from: 27, to: 28, speed: 4, loop: true },
        },
    });

    k.loadSprite("level-1", "./level-1.png");

    const {map: level1layout, spawnPoints: level1SpawnPoints} = await makeMap(
        k, 
        "level-1"
    );

    //level 1 scene
    k.scene("level-1", async () => {
        //sets background
        k.setGravity(2100);
        k.add([
            k.rect(k.width(), k.height()),
            k.color(k.Color.fromHex("#f7d7db")),
            k.fixed(),
        ]);

        //draw layout
        k.add(level1layout);

        //make and add player
        const kirb = makePlayer(
            k,
            level1SpawnPoints.Player[0].x,
            level1SpawnPoints.Player[0].y,
        );

        //load controls

        setControls(k, kirb);
        k.add(kirb);

        //camera settings
        k.camScale(k.vec2(0.7, 0.7));
        k.onUpdate(() => {
            if (kirb.pos.x < level1layout.pos.x + 432)
                k.camPos(kirb.pos.x + 500, 870);
        });

        // call enemies
        for (const burny of level1SpawnPoints.Burny) {
            makeBurnyEnemy(k, burny.x, burny.y);
        }

        for (const scaredy of level1SpawnPoints.scaredy) {
            makeScaredyEnemy(k, scaredy.x, scaredy.y);
        }

        for (const birb of level1SpawnPoints.birb) {
            const possibleSpeeds = [100, 200, 300];
            makeBirbEnemy(
                k,
                birb.x,
                birb.y,
                possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
            );
        }

    });

    k.scene("end", () => {});

    k.go("level-1");
}

gameSetup();