const debugMode = (import.meta.env.PROD) ? false : true;

/**
 * debug(context, called, caller, identifier)
 * - context: string
 * - called: string
 * - caller: string
 * - identifier: string
 * 
 * @param {*} context 
 * @param {*} called 
 * @param {*} caller 
 * @param {*} identifier 
 */
export function debug(context, called, caller, identifier) {
   if (!debugMode) return;
   if (caller !== "unknown") {
        console.log(` - [${context}] '${called}(${identifier})' called by ${caller}`);
   }
}