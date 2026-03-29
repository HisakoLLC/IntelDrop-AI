import { analyzeTip } from './lib/gemini.js';

const shengTip = "Sasa, nimeona MD wa county akichukua hongo ya 2M kwa hio project ya barabara kule mtaani.";
const result = await analyzeTip(shengTip);
console.log(JSON.stringify(result, null, 2));
