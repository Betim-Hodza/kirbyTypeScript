import { AreaComp, BodyComp, DoubleJumpComp, GameObj, HealthComp, KaboomCtx, OpacityComp, PosComp, ScaleComp, SpriteComp } from "kaboom";
import { scale } from "./constants";

type PlayerGameObj = GameObj<
    SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp & {
        speed: number;
        direction: string;
        isInhaling: boolean;
        isFull: boolean;
    }
>;

export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
    const player = k.make([
        k.sprite("assets", { anim: "kirbIdle"}),
        k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10)}),
        k.body(),
        k.pos(posX * scale, posY * scale),
        k.scale(scale),
        k.doubleJump(10),
        k.health(3),
        k.opacity(1),
        {
            speed: 300,
            direction: "right",
            isInhaling: false,
            isFull: false,
        },
        "player",
    ]);

    player.onCollide("enemy", async (enemy : GameObj) => {
        if (player.isInhaling && enemy.isInhalable) {
            player.isInhaling = false;
            k.destroy(enemy);
            player.isFull = true;
            return;
        }

        if (player.hp() === 0) {
            k.destroy(player);
            k.go("level-1");
            return;
        }

        player.hurt(); 

        //hurt animation flash
        await k.tween (
            player.opacity,
            0,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
        await k.tween (
            player.opacity,
            1,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
    });

    //exit door (want this to be where the player presses up they exit)
    // player.onKeyPress("up", () => {
    //     k.go("level-2");
    // })
    player.onCollide("exit", () => {
        k.go("level-2");
    });

    //inhale effect animation
    const inhaleEffect = k.add([
        k.sprite("assets", { anim: "kirbyInhaleEffect"}),
        k.pos(),
        k.scale(scale),
        k.opacity(0),
        "inhaleEffect",
    ]);

    //zone of inhale
    const inhaleZone = player.add([
        k.area({ shape: new k.Rect(k.vec2(0), 20, 4)}),
        k.pos(),
        "inhaleZone",
    ]);

    //update facing position and wheere swallowing
    inhaleZone.onUpdate(() => {

        if (player.direction === "left") {
            inhaleZone.pos = k.vec2(-14, 8);
            inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);
            inhaleEffect.flipX = true;
            return;
        }

        inhaleZone.pos = k.vec2(14, 8);
        inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y);
        inhaleEffect.flipX = false;
        
    });

    //if player falls
    player.onUpdate(() => {
        if (player.pos.y > 2000) {
            k.go("level-1");
        }
    });

    return player;
}

export function setControls(k: KaboomCtx, player: PlayerGameObj) {
    const inhaleEffectRef = k.get("inhaleEffect")[0]

    k.onKeyDown((key) => {
        switch (key) {
            case "left":
                player.direction = "left";
                player.flipX = true;
                player.move(-player.speed, 0);
                break;
            case "right":
                player.direction = "right";
                player.flipX = false;
                player.move(player.speed, 0);
                break;
            case "z":
                if(player.isFull) {
                    player.play("kirbFull");
                    inhaleEffectRef.opacity = 0;
                    break;
                }
                
                player.isInhaling = true;
                player.play("kirbInhaling")
                inhaleEffectRef.opacity = 1;
                break;
            default: 
        }
    })

    k.onKeyPress((key) => {
        switch (key) {
            case "x":
                player.doubleJump();
                break;
            default:
        }
    });

    k.onKeyRelease((key) => {
        switch (key) {
            case "z":
                if (player.isFull) {
                    player.play("kirbInhaling");
                    const shootingStar = k.add([
                        k.sprite("assets", {
                            anim: "shootingStar",
                            flipX: player.direction === "right",
                        }),
                        k.area({shape: new k.Rect(k.vec2(5, 4), 6, 6)}),
                        k.pos (
                            player.direction === "left" ? player.pos.x - 80 : player.pos.x + 80,
                            player.pos.y + 5
                        ),
                        k.scale(scale),
                        player.direction === "left"
                            ? k.move(k.LEFT, 800)
                            : k.move(k.RIGHT, 800),
                        "shootingStar",
                    ]);

                    shootingStar.onCollide("platform", () => k.destroy(shootingStar));
                    
                    player.isFull = false;
                    k.wait(1, () => player.play("kirbIdle"));
                    return;
                }

                inhaleEffectRef.opacity = 0;
                player.isInhaling = false;
                player.play("kirbIdle")
                break;
            default:
        }
    });
}

export function makeInhalable(k: KaboomCtx, enemy: GameObj) {
    enemy.onCollide("inhaleZone", () => {
      enemy.isInhalable = true;
    });
  
    enemy.onCollideEnd("inhaleZone", () => {
      enemy.isInhalable = false;
    });
  
    enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
      k.destroy(enemy);
      k.destroy(shootingStar);
    });
  
    const playerRef = k.get("player")[0];
    enemy.onUpdate(() => {
      if (playerRef.isInhaling && enemy.isInhalable) {
        if (playerRef.direction === "right") {
          enemy.move(-800, 0);
          return;
        }
        enemy.move(800, 0);
      }
    });
}

export function makeBurnyEnemy(k: KaboomCtx, posX: number, posY: number) {
    const burny = k.add([
        k.sprite("assets", { anim: "burny" }),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
        shape: new k.Rect(k.vec2(4, 6), 8, 10),
        collisionIgnore: ["enemy"],
        }),
        k.body(),
        k.state("idle", ["idle", "jump"]),
        "enemy",
    ]);

    makeInhalable(k, burny);

    burny.onStateEnter("idle", async () => {
        await k.wait(1);
        burny.enterState("jump");
    });

    burny.onStateEnter("jump", async () => {
        burny.jump(1000);
    });

    burny.onStateUpdate("jump", async () => {
        if (burny.isGrounded()) {
        burny.enterState("idle");
        }
    });

    return burny;
}

export function makeScaredyEnemy(k: KaboomCtx, posX: number, posY: number) {
  const Scaredy = k.add([
    k.sprite("assets", { anim: "scaredyWalk" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(2, 3.9), 12, 12),
      collisionIgnore: ["enemy"],
    }),
    k.body(),
    k.state("idle", ["idle", "left", "right", "jump"]),
    { isInhalable: false, speed: 100 },
    "enemy",
  ]);

  makeInhalable(k, Scaredy);

  Scaredy.onStateEnter("idle", async () => {
    await k.wait(1);
    Scaredy.enterState("left");
  });

  Scaredy.onStateEnter("left", async () => {
    Scaredy.flipX = false;
    await k.wait(2);
    Scaredy.enterState("right");
  });

  Scaredy.onStateUpdate("left", () => {
    Scaredy.move(-Scaredy.speed, 0);
  });

  Scaredy.onStateEnter("right", async () => {
    Scaredy.flipX = true;
    await k.wait(2);
    Scaredy.enterState("left");
  });

  Scaredy.onStateUpdate("right", () => {
    Scaredy.move(Scaredy.speed, 0);
  });

  return Scaredy;
}

export function makeBirbEnemy(
  k: KaboomCtx,
  posX: number,
  posY: number,
  speed: number
) {
  const Birb = k.add([
    k.sprite("assets", { anim: "birb" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"],
    }),
    k.body({ isStatic: true }),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 400 }),
    "enemy",
  ]);

  makeInhalable(k, Birb);

  return Birb;
}