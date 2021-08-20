//
// JSON Flattening
//
// https://stackoverflow.com/questions/24833379/why-and-when-do-we-need-to-flatten-json-objects
// https://codepen.io/awaht/pen/poEdmMa
//

function flattenJSONIntoRAW(json)
{
    const $flatten = (obj, prefixKey) =>
    {
        let results =[]
        const _flatter = k=>{
            const $isObject = typeof (obj[k]) === 'object' && obj[k] !== null;
            if ($isObject )
            {
                results = $flatten(obj[k], prefixKey? `${prefixKey}_${k}` : k)
                return results;
            }
            results= { [prefixKey? `${prefixKey}_${k}` : k] : obj[k] }
            return results
        };
        return Object.keys(obj).map(_flatter);
    }
    const __results = { }
    const flat      = $flatten(json)
    const _traverse = obj=> {
      const $obj = Array.isArray(obj) ? obj.forEach(item => _traverse(item)) : obj;
      $obj && Object.keys($obj).forEach(key=>__results[key] = $obj[key])
    }
    flat.forEach(entry=> _traverse(entry))
    return __results
}

module.exports = {
    flattenJSONIntoRAW
}
