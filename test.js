let proxy = new Proxy({}, {
    get: function(target, prop, receiver) {
        console.log(`GET ${prop}`);
        return target[prop];
    },
    set: function(target, prop, value, receiver) {
        console.log(`SET ${prop}=${value}`);
        target[prop] = value;
        return true;
    },
    deleteProperty: function(target, prop) {
        console.log(`DELETE ${prop}`);
        delete target[prop];
        return true;
    },
    ownKeys: function(target) {
        console.log('OWNKEYS');
        return Reflect.ownKeys(target);
    },
    has: function(target, prop) {
        console.log(`HAS ${prop}`);
        return prop in target;
    },
    defineProperty: function(target, prop, descriptor) {
        console.log(`DEFINEPROPERTY ${prop}`);
        return Reflect.defineProperty(target, prop, descriptor);
    },
    getOwnPropertyDescriptor: function(target, prop) {
        console.log(`GETOWNPROPERTYDESCRIPTOR ${prop}`);
        return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    getPrototypeOf: function(target) {
        console.log('GETPROTOTYPEOF');
        return Reflect.getPrototypeOf(target);
    },
    setPrototypeOf: function(target, prototype) {
        console.log('SETPROTOTYPEOF');
        return Reflect.setPrototypeOf(target, prototype);
    },
    isExtensible: function(target) {
        console.log('ISEXTENSIBLE');
        return Reflect.isExtensible(target);
    },
    preventExtensions: function(target) {
        console.log('PREVENTEXTENSIONS');
        return Reflect.preventExtensions(target);
    },
    apply: function(target, thisArg, argumentsList) {
        console.log('APPLY');
        return Reflect.apply(target, thisArg, argumentsList);
    },
    construct: function(target, argumentsList, newTarget) {
        console.log('CONSTRUCT');
        return Reflect.construct(target, argumentsList, newTarget);
    }
});










































function compileTemplate(template) {
  return template.replace(
    /{(.*?)}/g,
    "<span id='$1'><template>$1</template></span>"
  );
}

// Example usage:
const input = "This is {an} example {with} curly braces.";
const result = compileTemplate(input);

const funcString = "return a + b;";
const myFunction = new Function("a", "b", funcString);

let expParser = (param, funcString)=>{
    return new Function(param, `return ${funcString}`);
}
let renderFn=expParser('a', 'a.map(item=>`<div>{item}</div>)`)');
console.log(renderFn);

console.log(renderFn([1,2,3]))

let future = `        <div>
            <input type="text" id='value' bind={inputValue}  />
            <h1>this is so great {name}</h1>
            <h1>{fullname.firstName} {fullname.lastName}</h1>

            -> <h1> <span id='fullname.firstName'>{fullname.firstName}</span>  <span id='fullname.lastName'>{fullname.lastName}</span>  </h1>
            fn=(fullname)=>fullname.firstName
            html=fn(fullname)||''

            <button onclick="updateInput('1')">Display</button>

            <span id='fullname.firstName'>
                fn:(fullname)=>fullname.firstName
            </span>
            <span id='fullname.lastName'>
                fn:(fullname)=>fullname.lastName
            </span>

            <h1>
                {data.map(item=>(
                    <div>{item}</div>
                ))}
            </h1>
            <div>
                {isDisplay && <div>Display</div>}
            </div>
            <div>
                {isDisplay ? <div>Display</div> : <div>Not Display</div>}
            </div>
            <div>
                {data.map((item, index)=>(
                    <div>i:{index+1}</div>
                    <div>name: {item.name}</div>
                    <div>price: {item.price}</div>
                ))}

                <span id='data' loop>
                    fn:(data)=>data.map((item, index)=>(
                        <div>i:{index+1}</div>
                        <div>name: {item.name}</div>
                        <div>price: {item.price}</div>
                    )).join('')
            </div>
        </div>`;
