import kaboom from "kaboom";
import {scale} from "./constants"

export const k = kaboom({
    width: 256 * scale,
    height: 144 * scale,
    //gameboy res
    scale,
    letterbox: true,
    global: false, // want to only be able to use kaboom from this constant
});