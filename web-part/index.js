let map = new Map();
let shadowDom = new Map();
let events = new Map();
let $root, $log;
let startTime = 0;

const EVENT = {
    CHANGE: 'change',
};

const highlightElement = (el) => {
    el.animate(
        [
            { backgroundColor: 'yellow' },
            { backgroundColor: 'white' }
        ],
        { duration: 200, iterations: 1 });  
};

const renderItem = (key, value, _options) => {
    const options = {
        tagName: 'div',
        className: 'item',
        isObservable: true,
        eventListener: null,
        ..._options
    }
    if (!shadowDom.has(key)) {
        const $el = document.createElement(options.tagName || 'div', options);
        if (options.tagName === 'input') {
            $el.type = options.type;
            $el.checked = options.checked;
            if (options.eventListener) {
                $el.addEventListener('change', options.eventListener);
            }
        }
        if (options.tagName === 'div') {
            $el.classList.add(key);
            $el.innerHTML = value;
        }

        $root.append($el);

        shadowDom.set(key, { el: $el, value, options });
        return { el: $el, value, options };
    };
    const shadow = shadowDom.get(key);
    if (value !== shadow.value && shadow.options.isObservable) { 
        if (events.has(EVENT.CHANGE)) {
            const changeCallback = events.get(EVENT.CHANGE);
            changeCallback({ ...shadow, current: value, key });
        }
        shadow.el.innerHTML = value;
        shadow.value = value;
    };
    return shadow;
 };

const renderArray = (keyRow, value) => {
    const { el } = renderItem(`${keyRow}-input`, keyRow, {
        isObservable: false,
        tagName: 'input',
        type: 'checkbox',
        id: `check-${keyRow}`,
        checked: true
    });
    renderItem(`${keyRow}`, keyRow);
    if (el.checked) {
        if ($logcheckbox.checked) {
            log(`${keyRow},${value.toString()}`);
        }
        value.map((item, index) => renderItem(`${keyRow}-${index}`, item, {tagName: 'div'}));
    }
};

map.update = function (key, value) {
    renderArray(key, value);
    this.set(key, value);
 };

events.set(EVENT.CHANGE, ({ el }) => {
    highlightElement(el);
});

const log = (text) => {
    if (!startTime) { 
        startTime = Date.now();
    }
    $log.value += `${Date.now() - startTime},${text}\r\n`;
    $log.scrollTop = $log.scrollHeight;
}

const saveLog = () => {
    var a = document.createElement('a');
    with (a) {
        href='data:text/csv;base64,' + btoa($log.value);
        download='csvfile.csv';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

const clearLog = () => {
    $log.value = '';
    startTime = 0;
}

const wsConnection = new WebSocket("ws://localhost:8999");
wsConnection.onopen = function() {
    console.log("Connected.");
};

wsConnection.onclose = function(event) {
    if (event.wasClean) {
        console.log('Connection close.');
    } else {
        console.log('Disconected...'); 
    }
    console.log('Error code: ' + event.code + ' Reasone: ' + event.reason);
};

wsConnection.onerror = function(error) {
    console.log("Error " + error.message);
};

const wsSend = function(data) {
    if(!wsConnection.readyState){
        setTimeout(function (){
            wsSend(data);
        }, 100);
    } else {
        wsConnection.send(data);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    $root = document.body.querySelector('#app');
    $log = document.body.querySelector('#log');
    $logcheckbox = document.body.querySelector('#logcheckbox');
    $root.style.setProperty('--columns', 12);
    
    wsSend('Message form client side.');

    wsConnection.onmessage = (msg) => {
        const { id, data } = JSON.parse(msg.data);
        map.update(id, data);
    }
});
