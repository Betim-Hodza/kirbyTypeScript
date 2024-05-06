import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

export async function makeMap(k: KaboomCtx, name: string) {
    const mapData = await (await fetch(`./${name}.json`)).json();

    const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)]);

    const spawnPoints: {[key: string] : { x: number, y: number}[] } = {};

    for (const layer of mapData.layers) {
        if (layer.name == "Colliders") {
            for (const collider of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
                        collisionIgnore: ["platform", "exit"],
                    }),

                    collider.name !== "exit" ? k.body({isStatic: true}) : null,

                    k.pos(collider.x, collider.y),
                    collider.name !== "exit" ? "platform" : "exit"
                ]);
            }

            continue
        }

        if (layer.name === "Spawnpoints") {
            for (const spawnpoint of layer.objects) {
                if (spawnPoints[spawnpoint.name]) {
                    spawnPoints[spawnpoint.name].push ({
                        x: spawnpoint.x,
                        y: spawnpoint.y,
                    })
                    continue
                }

                spawnPoints[spawnpoint.name] = [{x: spawnpoint.x, y: spawnpoint.y}];

            }
        }
    }

    return {map, spawnPoints}
}