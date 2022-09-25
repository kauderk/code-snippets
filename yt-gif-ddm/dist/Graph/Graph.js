(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Graph = factory());
})(this, (function () { 'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var tinycolor$1 = {exports: {}};

    (function (module) {
    	// TinyColor v1.4.2
    	// https://github.com/bgrins/TinyColor
    	// Brian Grinstead, MIT License

    	(function(Math) {

    	var trimLeft = /^\s+/,
    	    trimRight = /\s+$/,
    	    tinyCounter = 0,
    	    mathRound = Math.round,
    	    mathMin = Math.min,
    	    mathMax = Math.max,
    	    mathRandom = Math.random;

    	function tinycolor (color, opts) {

    	    color = (color) ? color : '';
    	    opts = opts || { };

    	    // If input is already a tinycolor, return itself
    	    if (color instanceof tinycolor) {
    	       return color;
    	    }
    	    // If we are called as a function, call using new instead
    	    if (!(this instanceof tinycolor)) {
    	        return new tinycolor(color, opts);
    	    }

    	    var rgb = inputToRGB(color);
    	    this._originalInput = color,
    	    this._r = rgb.r,
    	    this._g = rgb.g,
    	    this._b = rgb.b,
    	    this._a = rgb.a,
    	    this._roundA = mathRound(100*this._a) / 100,
    	    this._format = opts.format || rgb.format;
    	    this._gradientType = opts.gradientType;

    	    // Don't let the range of [0,255] come back in [0,1].
    	    // Potentially lose a little bit of precision here, but will fix issues where
    	    // .5 gets interpreted as half of the total, instead of half of 1
    	    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
    	    if (this._r < 1) { this._r = mathRound(this._r); }
    	    if (this._g < 1) { this._g = mathRound(this._g); }
    	    if (this._b < 1) { this._b = mathRound(this._b); }

    	    this._ok = rgb.ok;
    	    this._tc_id = tinyCounter++;
    	}

    	tinycolor.prototype = {
    	    isDark: function() {
    	        return this.getBrightness() < 128;
    	    },
    	    isLight: function() {
    	        return !this.isDark();
    	    },
    	    isValid: function() {
    	        return this._ok;
    	    },
    	    getOriginalInput: function() {
    	      return this._originalInput;
    	    },
    	    getFormat: function() {
    	        return this._format;
    	    },
    	    getAlpha: function() {
    	        return this._a;
    	    },
    	    getBrightness: function() {
    	        //http://www.w3.org/TR/AERT#color-contrast
    	        var rgb = this.toRgb();
    	        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    	    },
    	    getLuminance: function() {
    	        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    	        var rgb = this.toRgb();
    	        var RsRGB, GsRGB, BsRGB, R, G, B;
    	        RsRGB = rgb.r/255;
    	        GsRGB = rgb.g/255;
    	        BsRGB = rgb.b/255;

    	        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
    	        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
    	        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
    	        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    	    },
    	    setAlpha: function(value) {
    	        this._a = boundAlpha(value);
    	        this._roundA = mathRound(100*this._a) / 100;
    	        return this;
    	    },
    	    toHsv: function() {
    	        var hsv = rgbToHsv(this._r, this._g, this._b);
    	        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
    	    },
    	    toHsvString: function() {
    	        var hsv = rgbToHsv(this._r, this._g, this._b);
    	        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
    	        return (this._a == 1) ?
    	          "hsv("  + h + ", " + s + "%, " + v + "%)" :
    	          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
    	    },
    	    toHsl: function() {
    	        var hsl = rgbToHsl(this._r, this._g, this._b);
    	        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
    	    },
    	    toHslString: function() {
    	        var hsl = rgbToHsl(this._r, this._g, this._b);
    	        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
    	        return (this._a == 1) ?
    	          "hsl("  + h + ", " + s + "%, " + l + "%)" :
    	          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
    	    },
    	    toHex: function(allow3Char) {
    	        return rgbToHex(this._r, this._g, this._b, allow3Char);
    	    },
    	    toHexString: function(allow3Char) {
    	        return '#' + this.toHex(allow3Char);
    	    },
    	    toHex8: function(allow4Char) {
    	        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
    	    },
    	    toHex8String: function(allow4Char) {
    	        return '#' + this.toHex8(allow4Char);
    	    },
    	    toRgb: function() {
    	        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
    	    },
    	    toRgbString: function() {
    	        return (this._a == 1) ?
    	          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
    	          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
    	    },
    	    toPercentageRgb: function() {
    	        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
    	    },
    	    toPercentageRgbString: function() {
    	        return (this._a == 1) ?
    	          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
    	          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
    	    },
    	    toName: function() {
    	        if (this._a === 0) {
    	            return "transparent";
    	        }

    	        if (this._a < 1) {
    	            return false;
    	        }

    	        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
    	    },
    	    toFilter: function(secondColor) {
    	        var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
    	        var secondHex8String = hex8String;
    	        var gradientType = this._gradientType ? "GradientType = 1, " : "";

    	        if (secondColor) {
    	            var s = tinycolor(secondColor);
    	            secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
    	        }

    	        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
    	    },
    	    toString: function(format) {
    	        var formatSet = !!format;
    	        format = format || this._format;

    	        var formattedString = false;
    	        var hasAlpha = this._a < 1 && this._a >= 0;
    	        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

    	        if (needsAlphaFormat) {
    	            // Special case for "transparent", all other non-alpha formats
    	            // will return rgba when there is transparency.
    	            if (format === "name" && this._a === 0) {
    	                return this.toName();
    	            }
    	            return this.toRgbString();
    	        }
    	        if (format === "rgb") {
    	            formattedString = this.toRgbString();
    	        }
    	        if (format === "prgb") {
    	            formattedString = this.toPercentageRgbString();
    	        }
    	        if (format === "hex" || format === "hex6") {
    	            formattedString = this.toHexString();
    	        }
    	        if (format === "hex3") {
    	            formattedString = this.toHexString(true);
    	        }
    	        if (format === "hex4") {
    	            formattedString = this.toHex8String(true);
    	        }
    	        if (format === "hex8") {
    	            formattedString = this.toHex8String();
    	        }
    	        if (format === "name") {
    	            formattedString = this.toName();
    	        }
    	        if (format === "hsl") {
    	            formattedString = this.toHslString();
    	        }
    	        if (format === "hsv") {
    	            formattedString = this.toHsvString();
    	        }

    	        return formattedString || this.toHexString();
    	    },
    	    clone: function() {
    	        return tinycolor(this.toString());
    	    },

    	    _applyModification: function(fn, args) {
    	        var color = fn.apply(null, [this].concat([].slice.call(args)));
    	        this._r = color._r;
    	        this._g = color._g;
    	        this._b = color._b;
    	        this.setAlpha(color._a);
    	        return this;
    	    },
    	    lighten: function() {
    	        return this._applyModification(lighten, arguments);
    	    },
    	    brighten: function() {
    	        return this._applyModification(brighten, arguments);
    	    },
    	    darken: function() {
    	        return this._applyModification(darken, arguments);
    	    },
    	    desaturate: function() {
    	        return this._applyModification(desaturate, arguments);
    	    },
    	    saturate: function() {
    	        return this._applyModification(saturate, arguments);
    	    },
    	    greyscale: function() {
    	        return this._applyModification(greyscale, arguments);
    	    },
    	    spin: function() {
    	        return this._applyModification(spin, arguments);
    	    },

    	    _applyCombination: function(fn, args) {
    	        return fn.apply(null, [this].concat([].slice.call(args)));
    	    },
    	    analogous: function() {
    	        return this._applyCombination(analogous, arguments);
    	    },
    	    complement: function() {
    	        return this._applyCombination(complement, arguments);
    	    },
    	    monochromatic: function() {
    	        return this._applyCombination(monochromatic, arguments);
    	    },
    	    splitcomplement: function() {
    	        return this._applyCombination(splitcomplement, arguments);
    	    },
    	    triad: function() {
    	        return this._applyCombination(triad, arguments);
    	    },
    	    tetrad: function() {
    	        return this._applyCombination(tetrad, arguments);
    	    }
    	};

    	// If input is an object, force 1 into "1.0" to handle ratios properly
    	// String input requires "1.0" as input, so 1 will be treated as 1
    	tinycolor.fromRatio = function(color, opts) {
    	    if (typeof color == "object") {
    	        var newColor = {};
    	        for (var i in color) {
    	            if (color.hasOwnProperty(i)) {
    	                if (i === "a") {
    	                    newColor[i] = color[i];
    	                }
    	                else {
    	                    newColor[i] = convertToPercentage(color[i]);
    	                }
    	            }
    	        }
    	        color = newColor;
    	    }

    	    return tinycolor(color, opts);
    	};

    	// Given a string or object, convert that input to RGB
    	// Possible string inputs:
    	//
    	//     "red"
    	//     "#f00" or "f00"
    	//     "#ff0000" or "ff0000"
    	//     "#ff000000" or "ff000000"
    	//     "rgb 255 0 0" or "rgb (255, 0, 0)"
    	//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    	//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    	//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    	//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    	//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    	//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    	//
    	function inputToRGB(color) {

    	    var rgb = { r: 0, g: 0, b: 0 };
    	    var a = 1;
    	    var s = null;
    	    var v = null;
    	    var l = null;
    	    var ok = false;
    	    var format = false;

    	    if (typeof color == "string") {
    	        color = stringInputToObject(color);
    	    }

    	    if (typeof color == "object") {
    	        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
    	            rgb = rgbToRgb(color.r, color.g, color.b);
    	            ok = true;
    	            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
    	        }
    	        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
    	            s = convertToPercentage(color.s);
    	            v = convertToPercentage(color.v);
    	            rgb = hsvToRgb(color.h, s, v);
    	            ok = true;
    	            format = "hsv";
    	        }
    	        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
    	            s = convertToPercentage(color.s);
    	            l = convertToPercentage(color.l);
    	            rgb = hslToRgb(color.h, s, l);
    	            ok = true;
    	            format = "hsl";
    	        }

    	        if (color.hasOwnProperty("a")) {
    	            a = color.a;
    	        }
    	    }

    	    a = boundAlpha(a);

    	    return {
    	        ok: ok,
    	        format: color.format || format,
    	        r: mathMin(255, mathMax(rgb.r, 0)),
    	        g: mathMin(255, mathMax(rgb.g, 0)),
    	        b: mathMin(255, mathMax(rgb.b, 0)),
    	        a: a
    	    };
    	}


    	// Conversion Functions
    	// --------------------

    	// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    	// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    	// `rgbToRgb`
    	// Handle bounds / percentage checking to conform to CSS color spec
    	// <http://www.w3.org/TR/css3-color/>
    	// *Assumes:* r, g, b in [0, 255] or [0, 1]
    	// *Returns:* { r, g, b } in [0, 255]
    	function rgbToRgb(r, g, b){
    	    return {
    	        r: bound01(r, 255) * 255,
    	        g: bound01(g, 255) * 255,
    	        b: bound01(b, 255) * 255
    	    };
    	}

    	// `rgbToHsl`
    	// Converts an RGB color value to HSL.
    	// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    	// *Returns:* { h, s, l } in [0,1]
    	function rgbToHsl(r, g, b) {

    	    r = bound01(r, 255);
    	    g = bound01(g, 255);
    	    b = bound01(b, 255);

    	    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    	    var h, s, l = (max + min) / 2;

    	    if(max == min) {
    	        h = s = 0; // achromatic
    	    }
    	    else {
    	        var d = max - min;
    	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    	        switch(max) {
    	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    	            case g: h = (b - r) / d + 2; break;
    	            case b: h = (r - g) / d + 4; break;
    	        }

    	        h /= 6;
    	    }

    	    return { h: h, s: s, l: l };
    	}

    	// `hslToRgb`
    	// Converts an HSL color value to RGB.
    	// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    	// *Returns:* { r, g, b } in the set [0, 255]
    	function hslToRgb(h, s, l) {
    	    var r, g, b;

    	    h = bound01(h, 360);
    	    s = bound01(s, 100);
    	    l = bound01(l, 100);

    	    function hue2rgb(p, q, t) {
    	        if(t < 0) t += 1;
    	        if(t > 1) t -= 1;
    	        if(t < 1/6) return p + (q - p) * 6 * t;
    	        if(t < 1/2) return q;
    	        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    	        return p;
    	    }

    	    if(s === 0) {
    	        r = g = b = l; // achromatic
    	    }
    	    else {
    	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    	        var p = 2 * l - q;
    	        r = hue2rgb(p, q, h + 1/3);
    	        g = hue2rgb(p, q, h);
    	        b = hue2rgb(p, q, h - 1/3);
    	    }

    	    return { r: r * 255, g: g * 255, b: b * 255 };
    	}

    	// `rgbToHsv`
    	// Converts an RGB color value to HSV
    	// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    	// *Returns:* { h, s, v } in [0,1]
    	function rgbToHsv(r, g, b) {

    	    r = bound01(r, 255);
    	    g = bound01(g, 255);
    	    b = bound01(b, 255);

    	    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    	    var h, s, v = max;

    	    var d = max - min;
    	    s = max === 0 ? 0 : d / max;

    	    if(max == min) {
    	        h = 0; // achromatic
    	    }
    	    else {
    	        switch(max) {
    	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    	            case g: h = (b - r) / d + 2; break;
    	            case b: h = (r - g) / d + 4; break;
    	        }
    	        h /= 6;
    	    }
    	    return { h: h, s: s, v: v };
    	}

    	// `hsvToRgb`
    	// Converts an HSV color value to RGB.
    	// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    	// *Returns:* { r, g, b } in the set [0, 255]
    	 function hsvToRgb(h, s, v) {

    	    h = bound01(h, 360) * 6;
    	    s = bound01(s, 100);
    	    v = bound01(v, 100);

    	    var i = Math.floor(h),
    	        f = h - i,
    	        p = v * (1 - s),
    	        q = v * (1 - f * s),
    	        t = v * (1 - (1 - f) * s),
    	        mod = i % 6,
    	        r = [v, q, p, p, t, v][mod],
    	        g = [t, v, v, q, p, p][mod],
    	        b = [p, p, t, v, v, q][mod];

    	    return { r: r * 255, g: g * 255, b: b * 255 };
    	}

    	// `rgbToHex`
    	// Converts an RGB color to hex
    	// Assumes r, g, and b are contained in the set [0, 255]
    	// Returns a 3 or 6 character hex
    	function rgbToHex(r, g, b, allow3Char) {

    	    var hex = [
    	        pad2(mathRound(r).toString(16)),
    	        pad2(mathRound(g).toString(16)),
    	        pad2(mathRound(b).toString(16))
    	    ];

    	    // Return a 3 character hex if possible
    	    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
    	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    	    }

    	    return hex.join("");
    	}

    	// `rgbaToHex`
    	// Converts an RGBA color plus alpha transparency to hex
    	// Assumes r, g, b are contained in the set [0, 255] and
    	// a in [0, 1]. Returns a 4 or 8 character rgba hex
    	function rgbaToHex(r, g, b, a, allow4Char) {

    	    var hex = [
    	        pad2(mathRound(r).toString(16)),
    	        pad2(mathRound(g).toString(16)),
    	        pad2(mathRound(b).toString(16)),
    	        pad2(convertDecimalToHex(a))
    	    ];

    	    // Return a 4 character hex if possible
    	    if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
    	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
    	    }

    	    return hex.join("");
    	}

    	// `rgbaToArgbHex`
    	// Converts an RGBA color to an ARGB Hex8 string
    	// Rarely used, but required for "toFilter()"
    	function rgbaToArgbHex(r, g, b, a) {

    	    var hex = [
    	        pad2(convertDecimalToHex(a)),
    	        pad2(mathRound(r).toString(16)),
    	        pad2(mathRound(g).toString(16)),
    	        pad2(mathRound(b).toString(16))
    	    ];

    	    return hex.join("");
    	}

    	// `equals`
    	// Can be called with any tinycolor input
    	tinycolor.equals = function (color1, color2) {
    	    if (!color1 || !color2) { return false; }
    	    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    	};

    	tinycolor.random = function() {
    	    return tinycolor.fromRatio({
    	        r: mathRandom(),
    	        g: mathRandom(),
    	        b: mathRandom()
    	    });
    	};


    	// Modification Functions
    	// ----------------------
    	// Thanks to less.js for some of the basics here
    	// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    	function desaturate(color, amount) {
    	    amount = (amount === 0) ? 0 : (amount || 10);
    	    var hsl = tinycolor(color).toHsl();
    	    hsl.s -= amount / 100;
    	    hsl.s = clamp01(hsl.s);
    	    return tinycolor(hsl);
    	}

    	function saturate(color, amount) {
    	    amount = (amount === 0) ? 0 : (amount || 10);
    	    var hsl = tinycolor(color).toHsl();
    	    hsl.s += amount / 100;
    	    hsl.s = clamp01(hsl.s);
    	    return tinycolor(hsl);
    	}

    	function greyscale(color) {
    	    return tinycolor(color).desaturate(100);
    	}

    	function lighten (color, amount) {
    	    amount = (amount === 0) ? 0 : (amount || 10);
    	    var hsl = tinycolor(color).toHsl();
    	    hsl.l += amount / 100;
    	    hsl.l = clamp01(hsl.l);
    	    return tinycolor(hsl);
    	}

    	function brighten(color, amount) {
    	    amount = (amount === 0) ? 0 : (amount || 10);
    	    var rgb = tinycolor(color).toRgb();
    	    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
    	    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
    	    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
    	    return tinycolor(rgb);
    	}

    	function darken (color, amount) {
    	    amount = (amount === 0) ? 0 : (amount || 10);
    	    var hsl = tinycolor(color).toHsl();
    	    hsl.l -= amount / 100;
    	    hsl.l = clamp01(hsl.l);
    	    return tinycolor(hsl);
    	}

    	// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    	// Values outside of this range will be wrapped into this range.
    	function spin(color, amount) {
    	    var hsl = tinycolor(color).toHsl();
    	    var hue = (hsl.h + amount) % 360;
    	    hsl.h = hue < 0 ? 360 + hue : hue;
    	    return tinycolor(hsl);
    	}

    	// Combination Functions
    	// ---------------------
    	// Thanks to jQuery xColor for some of the ideas behind these
    	// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    	function complement(color) {
    	    var hsl = tinycolor(color).toHsl();
    	    hsl.h = (hsl.h + 180) % 360;
    	    return tinycolor(hsl);
    	}

    	function triad(color) {
    	    var hsl = tinycolor(color).toHsl();
    	    var h = hsl.h;
    	    return [
    	        tinycolor(color),
    	        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
    	        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    	    ];
    	}

    	function tetrad(color) {
    	    var hsl = tinycolor(color).toHsl();
    	    var h = hsl.h;
    	    return [
    	        tinycolor(color),
    	        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
    	        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
    	        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    	    ];
    	}

    	function splitcomplement(color) {
    	    var hsl = tinycolor(color).toHsl();
    	    var h = hsl.h;
    	    return [
    	        tinycolor(color),
    	        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
    	        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    	    ];
    	}

    	function analogous(color, results, slices) {
    	    results = results || 6;
    	    slices = slices || 30;

    	    var hsl = tinycolor(color).toHsl();
    	    var part = 360 / slices;
    	    var ret = [tinycolor(color)];

    	    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
    	        hsl.h = (hsl.h + part) % 360;
    	        ret.push(tinycolor(hsl));
    	    }
    	    return ret;
    	}

    	function monochromatic(color, results) {
    	    results = results || 6;
    	    var hsv = tinycolor(color).toHsv();
    	    var h = hsv.h, s = hsv.s, v = hsv.v;
    	    var ret = [];
    	    var modification = 1 / results;

    	    while (results--) {
    	        ret.push(tinycolor({ h: h, s: s, v: v}));
    	        v = (v + modification) % 1;
    	    }

    	    return ret;
    	}

    	// Utility Functions
    	// ---------------------

    	tinycolor.mix = function(color1, color2, amount) {
    	    amount = (amount === 0) ? 0 : (amount || 50);

    	    var rgb1 = tinycolor(color1).toRgb();
    	    var rgb2 = tinycolor(color2).toRgb();

    	    var p = amount / 100;

    	    var rgba = {
    	        r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
    	        g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
    	        b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
    	        a: ((rgb2.a - rgb1.a) * p) + rgb1.a
    	    };

    	    return tinycolor(rgba);
    	};


    	// Readability Functions
    	// ---------------------
    	// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

    	// `contrast`
    	// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
    	tinycolor.readability = function(color1, color2) {
    	    var c1 = tinycolor(color1);
    	    var c2 = tinycolor(color2);
    	    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
    	};

    	// `isReadable`
    	// Ensure that foreground and background color combinations meet WCAG2 guidelines.
    	// The third argument is an optional Object.
    	//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
    	//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
    	// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

    	// *Example*
    	//    tinycolor.isReadable("#000", "#111") => false
    	//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
    	tinycolor.isReadable = function(color1, color2, wcag2) {
    	    var readability = tinycolor.readability(color1, color2);
    	    var wcag2Parms, out;

    	    out = false;

    	    wcag2Parms = validateWCAG2Parms(wcag2);
    	    switch (wcag2Parms.level + wcag2Parms.size) {
    	        case "AAsmall":
    	        case "AAAlarge":
    	            out = readability >= 4.5;
    	            break;
    	        case "AAlarge":
    	            out = readability >= 3;
    	            break;
    	        case "AAAsmall":
    	            out = readability >= 7;
    	            break;
    	    }
    	    return out;

    	};

    	// `mostReadable`
    	// Given a base color and a list of possible foreground or background
    	// colors for that base, returns the most readable color.
    	// Optionally returns Black or White if the most readable color is unreadable.
    	// *Example*
    	//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
    	//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
    	//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
    	//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
    	tinycolor.mostReadable = function(baseColor, colorList, args) {
    	    var bestColor = null;
    	    var bestScore = 0;
    	    var readability;
    	    var includeFallbackColors, level, size ;
    	    args = args || {};
    	    includeFallbackColors = args.includeFallbackColors ;
    	    level = args.level;
    	    size = args.size;

    	    for (var i= 0; i < colorList.length ; i++) {
    	        readability = tinycolor.readability(baseColor, colorList[i]);
    	        if (readability > bestScore) {
    	            bestScore = readability;
    	            bestColor = tinycolor(colorList[i]);
    	        }
    	    }

    	    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
    	        return bestColor;
    	    }
    	    else {
    	        args.includeFallbackColors=false;
    	        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
    	    }
    	};


    	// Big List of Colors
    	// ------------------
    	// <http://www.w3.org/TR/css3-color/#svg-color>
    	var names = tinycolor.names = {
    	    aliceblue: "f0f8ff",
    	    antiquewhite: "faebd7",
    	    aqua: "0ff",
    	    aquamarine: "7fffd4",
    	    azure: "f0ffff",
    	    beige: "f5f5dc",
    	    bisque: "ffe4c4",
    	    black: "000",
    	    blanchedalmond: "ffebcd",
    	    blue: "00f",
    	    blueviolet: "8a2be2",
    	    brown: "a52a2a",
    	    burlywood: "deb887",
    	    burntsienna: "ea7e5d",
    	    cadetblue: "5f9ea0",
    	    chartreuse: "7fff00",
    	    chocolate: "d2691e",
    	    coral: "ff7f50",
    	    cornflowerblue: "6495ed",
    	    cornsilk: "fff8dc",
    	    crimson: "dc143c",
    	    cyan: "0ff",
    	    darkblue: "00008b",
    	    darkcyan: "008b8b",
    	    darkgoldenrod: "b8860b",
    	    darkgray: "a9a9a9",
    	    darkgreen: "006400",
    	    darkgrey: "a9a9a9",
    	    darkkhaki: "bdb76b",
    	    darkmagenta: "8b008b",
    	    darkolivegreen: "556b2f",
    	    darkorange: "ff8c00",
    	    darkorchid: "9932cc",
    	    darkred: "8b0000",
    	    darksalmon: "e9967a",
    	    darkseagreen: "8fbc8f",
    	    darkslateblue: "483d8b",
    	    darkslategray: "2f4f4f",
    	    darkslategrey: "2f4f4f",
    	    darkturquoise: "00ced1",
    	    darkviolet: "9400d3",
    	    deeppink: "ff1493",
    	    deepskyblue: "00bfff",
    	    dimgray: "696969",
    	    dimgrey: "696969",
    	    dodgerblue: "1e90ff",
    	    firebrick: "b22222",
    	    floralwhite: "fffaf0",
    	    forestgreen: "228b22",
    	    fuchsia: "f0f",
    	    gainsboro: "dcdcdc",
    	    ghostwhite: "f8f8ff",
    	    gold: "ffd700",
    	    goldenrod: "daa520",
    	    gray: "808080",
    	    green: "008000",
    	    greenyellow: "adff2f",
    	    grey: "808080",
    	    honeydew: "f0fff0",
    	    hotpink: "ff69b4",
    	    indianred: "cd5c5c",
    	    indigo: "4b0082",
    	    ivory: "fffff0",
    	    khaki: "f0e68c",
    	    lavender: "e6e6fa",
    	    lavenderblush: "fff0f5",
    	    lawngreen: "7cfc00",
    	    lemonchiffon: "fffacd",
    	    lightblue: "add8e6",
    	    lightcoral: "f08080",
    	    lightcyan: "e0ffff",
    	    lightgoldenrodyellow: "fafad2",
    	    lightgray: "d3d3d3",
    	    lightgreen: "90ee90",
    	    lightgrey: "d3d3d3",
    	    lightpink: "ffb6c1",
    	    lightsalmon: "ffa07a",
    	    lightseagreen: "20b2aa",
    	    lightskyblue: "87cefa",
    	    lightslategray: "789",
    	    lightslategrey: "789",
    	    lightsteelblue: "b0c4de",
    	    lightyellow: "ffffe0",
    	    lime: "0f0",
    	    limegreen: "32cd32",
    	    linen: "faf0e6",
    	    magenta: "f0f",
    	    maroon: "800000",
    	    mediumaquamarine: "66cdaa",
    	    mediumblue: "0000cd",
    	    mediumorchid: "ba55d3",
    	    mediumpurple: "9370db",
    	    mediumseagreen: "3cb371",
    	    mediumslateblue: "7b68ee",
    	    mediumspringgreen: "00fa9a",
    	    mediumturquoise: "48d1cc",
    	    mediumvioletred: "c71585",
    	    midnightblue: "191970",
    	    mintcream: "f5fffa",
    	    mistyrose: "ffe4e1",
    	    moccasin: "ffe4b5",
    	    navajowhite: "ffdead",
    	    navy: "000080",
    	    oldlace: "fdf5e6",
    	    olive: "808000",
    	    olivedrab: "6b8e23",
    	    orange: "ffa500",
    	    orangered: "ff4500",
    	    orchid: "da70d6",
    	    palegoldenrod: "eee8aa",
    	    palegreen: "98fb98",
    	    paleturquoise: "afeeee",
    	    palevioletred: "db7093",
    	    papayawhip: "ffefd5",
    	    peachpuff: "ffdab9",
    	    peru: "cd853f",
    	    pink: "ffc0cb",
    	    plum: "dda0dd",
    	    powderblue: "b0e0e6",
    	    purple: "800080",
    	    rebeccapurple: "663399",
    	    red: "f00",
    	    rosybrown: "bc8f8f",
    	    royalblue: "4169e1",
    	    saddlebrown: "8b4513",
    	    salmon: "fa8072",
    	    sandybrown: "f4a460",
    	    seagreen: "2e8b57",
    	    seashell: "fff5ee",
    	    sienna: "a0522d",
    	    silver: "c0c0c0",
    	    skyblue: "87ceeb",
    	    slateblue: "6a5acd",
    	    slategray: "708090",
    	    slategrey: "708090",
    	    snow: "fffafa",
    	    springgreen: "00ff7f",
    	    steelblue: "4682b4",
    	    tan: "d2b48c",
    	    teal: "008080",
    	    thistle: "d8bfd8",
    	    tomato: "ff6347",
    	    turquoise: "40e0d0",
    	    violet: "ee82ee",
    	    wheat: "f5deb3",
    	    white: "fff",
    	    whitesmoke: "f5f5f5",
    	    yellow: "ff0",
    	    yellowgreen: "9acd32"
    	};

    	// Make it easy to access colors via `hexNames[hex]`
    	var hexNames = tinycolor.hexNames = flip(names);


    	// Utilities
    	// ---------

    	// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    	function flip(o) {
    	    var flipped = { };
    	    for (var i in o) {
    	        if (o.hasOwnProperty(i)) {
    	            flipped[o[i]] = i;
    	        }
    	    }
    	    return flipped;
    	}

    	// Return a valid alpha value [0,1] with all invalid values being set to 1
    	function boundAlpha(a) {
    	    a = parseFloat(a);

    	    if (isNaN(a) || a < 0 || a > 1) {
    	        a = 1;
    	    }

    	    return a;
    	}

    	// Take input from [0, n] and return it as [0, 1]
    	function bound01(n, max) {
    	    if (isOnePointZero(n)) { n = "100%"; }

    	    var processPercent = isPercentage(n);
    	    n = mathMin(max, mathMax(0, parseFloat(n)));

    	    // Automatically convert percentage into number
    	    if (processPercent) {
    	        n = parseInt(n * max, 10) / 100;
    	    }

    	    // Handle floating point rounding errors
    	    if ((Math.abs(n - max) < 0.000001)) {
    	        return 1;
    	    }

    	    // Convert into [0, 1] range if it isn't already
    	    return (n % max) / parseFloat(max);
    	}

    	// Force a number between 0 and 1
    	function clamp01(val) {
    	    return mathMin(1, mathMax(0, val));
    	}

    	// Parse a base-16 hex value into a base-10 integer
    	function parseIntFromHex(val) {
    	    return parseInt(val, 16);
    	}

    	// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    	// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    	function isOnePointZero(n) {
    	    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    	}

    	// Check to see if string passed in is a percentage
    	function isPercentage(n) {
    	    return typeof n === "string" && n.indexOf('%') != -1;
    	}

    	// Force a hex value to have 2 characters
    	function pad2(c) {
    	    return c.length == 1 ? '0' + c : '' + c;
    	}

    	// Replace a decimal with it's percentage value
    	function convertToPercentage(n) {
    	    if (n <= 1) {
    	        n = (n * 100) + "%";
    	    }

    	    return n;
    	}

    	// Converts a decimal to a hex value
    	function convertDecimalToHex(d) {
    	    return Math.round(parseFloat(d) * 255).toString(16);
    	}
    	// Converts a hex value to a decimal
    	function convertHexToDecimal(h) {
    	    return (parseIntFromHex(h) / 255);
    	}

    	var matchers = (function() {

    	    // <http://www.w3.org/TR/css3-values/#integers>
    	    var CSS_INTEGER = "[-\\+]?\\d+%?";

    	    // <http://www.w3.org/TR/css3-values/#number-value>
    	    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

    	    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    	    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

    	    // Actual matching.
    	    // Parentheses and commas are optional, but not required.
    	    // Whitespace can take the place of commas or opening paren
    	    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    	    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

    	    return {
    	        CSS_UNIT: new RegExp(CSS_UNIT),
    	        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
    	        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
    	        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
    	        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
    	        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
    	        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
    	        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    	        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    	        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    	        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    	    };
    	})();

    	// `isValidCSSUnit`
    	// Take in a single string / number and check to see if it looks like a CSS unit
    	// (see `matchers` above for definition).
    	function isValidCSSUnit(color) {
    	    return !!matchers.CSS_UNIT.exec(color);
    	}

    	// `stringInputToObject`
    	// Permissive string parsing.  Take in a number of formats, and output an object
    	// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    	function stringInputToObject(color) {

    	    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    	    var named = false;
    	    if (names[color]) {
    	        color = names[color];
    	        named = true;
    	    }
    	    else if (color == 'transparent') {
    	        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    	    }

    	    // Try to match string input using regular expressions.
    	    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    	    // Just return an object and let the conversion functions handle that.
    	    // This way the result will be the same whether the tinycolor is initialized with string or object.
    	    var match;
    	    if ((match = matchers.rgb.exec(color))) {
    	        return { r: match[1], g: match[2], b: match[3] };
    	    }
    	    if ((match = matchers.rgba.exec(color))) {
    	        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    	    }
    	    if ((match = matchers.hsl.exec(color))) {
    	        return { h: match[1], s: match[2], l: match[3] };
    	    }
    	    if ((match = matchers.hsla.exec(color))) {
    	        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    	    }
    	    if ((match = matchers.hsv.exec(color))) {
    	        return { h: match[1], s: match[2], v: match[3] };
    	    }
    	    if ((match = matchers.hsva.exec(color))) {
    	        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    	    }
    	    if ((match = matchers.hex8.exec(color))) {
    	        return {
    	            r: parseIntFromHex(match[1]),
    	            g: parseIntFromHex(match[2]),
    	            b: parseIntFromHex(match[3]),
    	            a: convertHexToDecimal(match[4]),
    	            format: named ? "name" : "hex8"
    	        };
    	    }
    	    if ((match = matchers.hex6.exec(color))) {
    	        return {
    	            r: parseIntFromHex(match[1]),
    	            g: parseIntFromHex(match[2]),
    	            b: parseIntFromHex(match[3]),
    	            format: named ? "name" : "hex"
    	        };
    	    }
    	    if ((match = matchers.hex4.exec(color))) {
    	        return {
    	            r: parseIntFromHex(match[1] + '' + match[1]),
    	            g: parseIntFromHex(match[2] + '' + match[2]),
    	            b: parseIntFromHex(match[3] + '' + match[3]),
    	            a: convertHexToDecimal(match[4] + '' + match[4]),
    	            format: named ? "name" : "hex8"
    	        };
    	    }
    	    if ((match = matchers.hex3.exec(color))) {
    	        return {
    	            r: parseIntFromHex(match[1] + '' + match[1]),
    	            g: parseIntFromHex(match[2] + '' + match[2]),
    	            b: parseIntFromHex(match[3] + '' + match[3]),
    	            format: named ? "name" : "hex"
    	        };
    	    }

    	    return false;
    	}

    	function validateWCAG2Parms(parms) {
    	    // return valid WCAG2 parms for isReadable.
    	    // If input parms are invalid, return {"level":"AA", "size":"small"}
    	    var level, size;
    	    parms = parms || {"level":"AA", "size":"small"};
    	    level = (parms.level || "AA").toUpperCase();
    	    size = (parms.size || "small").toLowerCase();
    	    if (level !== "AA" && level !== "AAA") {
    	        level = "AA";
    	    }
    	    if (size !== "small" && size !== "large") {
    	        size = "small";
    	    }
    	    return {"level":level, "size":size};
    	}

    	// Node: Export function
    	if (module.exports) {
    	    module.exports = tinycolor;
    	}
    	// AMD/requirejs: Define the module
    	else {
    	    window.tinycolor = tinycolor;
    	}

    	})(Math);
    } (tinycolor$1));

    var tinycolor = tinycolor$1.exports;

    var colorString$1 = {exports: {}};

    var colorName = {
    	"aliceblue": [240, 248, 255],
    	"antiquewhite": [250, 235, 215],
    	"aqua": [0, 255, 255],
    	"aquamarine": [127, 255, 212],
    	"azure": [240, 255, 255],
    	"beige": [245, 245, 220],
    	"bisque": [255, 228, 196],
    	"black": [0, 0, 0],
    	"blanchedalmond": [255, 235, 205],
    	"blue": [0, 0, 255],
    	"blueviolet": [138, 43, 226],
    	"brown": [165, 42, 42],
    	"burlywood": [222, 184, 135],
    	"cadetblue": [95, 158, 160],
    	"chartreuse": [127, 255, 0],
    	"chocolate": [210, 105, 30],
    	"coral": [255, 127, 80],
    	"cornflowerblue": [100, 149, 237],
    	"cornsilk": [255, 248, 220],
    	"crimson": [220, 20, 60],
    	"cyan": [0, 255, 255],
    	"darkblue": [0, 0, 139],
    	"darkcyan": [0, 139, 139],
    	"darkgoldenrod": [184, 134, 11],
    	"darkgray": [169, 169, 169],
    	"darkgreen": [0, 100, 0],
    	"darkgrey": [169, 169, 169],
    	"darkkhaki": [189, 183, 107],
    	"darkmagenta": [139, 0, 139],
    	"darkolivegreen": [85, 107, 47],
    	"darkorange": [255, 140, 0],
    	"darkorchid": [153, 50, 204],
    	"darkred": [139, 0, 0],
    	"darksalmon": [233, 150, 122],
    	"darkseagreen": [143, 188, 143],
    	"darkslateblue": [72, 61, 139],
    	"darkslategray": [47, 79, 79],
    	"darkslategrey": [47, 79, 79],
    	"darkturquoise": [0, 206, 209],
    	"darkviolet": [148, 0, 211],
    	"deeppink": [255, 20, 147],
    	"deepskyblue": [0, 191, 255],
    	"dimgray": [105, 105, 105],
    	"dimgrey": [105, 105, 105],
    	"dodgerblue": [30, 144, 255],
    	"firebrick": [178, 34, 34],
    	"floralwhite": [255, 250, 240],
    	"forestgreen": [34, 139, 34],
    	"fuchsia": [255, 0, 255],
    	"gainsboro": [220, 220, 220],
    	"ghostwhite": [248, 248, 255],
    	"gold": [255, 215, 0],
    	"goldenrod": [218, 165, 32],
    	"gray": [128, 128, 128],
    	"green": [0, 128, 0],
    	"greenyellow": [173, 255, 47],
    	"grey": [128, 128, 128],
    	"honeydew": [240, 255, 240],
    	"hotpink": [255, 105, 180],
    	"indianred": [205, 92, 92],
    	"indigo": [75, 0, 130],
    	"ivory": [255, 255, 240],
    	"khaki": [240, 230, 140],
    	"lavender": [230, 230, 250],
    	"lavenderblush": [255, 240, 245],
    	"lawngreen": [124, 252, 0],
    	"lemonchiffon": [255, 250, 205],
    	"lightblue": [173, 216, 230],
    	"lightcoral": [240, 128, 128],
    	"lightcyan": [224, 255, 255],
    	"lightgoldenrodyellow": [250, 250, 210],
    	"lightgray": [211, 211, 211],
    	"lightgreen": [144, 238, 144],
    	"lightgrey": [211, 211, 211],
    	"lightpink": [255, 182, 193],
    	"lightsalmon": [255, 160, 122],
    	"lightseagreen": [32, 178, 170],
    	"lightskyblue": [135, 206, 250],
    	"lightslategray": [119, 136, 153],
    	"lightslategrey": [119, 136, 153],
    	"lightsteelblue": [176, 196, 222],
    	"lightyellow": [255, 255, 224],
    	"lime": [0, 255, 0],
    	"limegreen": [50, 205, 50],
    	"linen": [250, 240, 230],
    	"magenta": [255, 0, 255],
    	"maroon": [128, 0, 0],
    	"mediumaquamarine": [102, 205, 170],
    	"mediumblue": [0, 0, 205],
    	"mediumorchid": [186, 85, 211],
    	"mediumpurple": [147, 112, 219],
    	"mediumseagreen": [60, 179, 113],
    	"mediumslateblue": [123, 104, 238],
    	"mediumspringgreen": [0, 250, 154],
    	"mediumturquoise": [72, 209, 204],
    	"mediumvioletred": [199, 21, 133],
    	"midnightblue": [25, 25, 112],
    	"mintcream": [245, 255, 250],
    	"mistyrose": [255, 228, 225],
    	"moccasin": [255, 228, 181],
    	"navajowhite": [255, 222, 173],
    	"navy": [0, 0, 128],
    	"oldlace": [253, 245, 230],
    	"olive": [128, 128, 0],
    	"olivedrab": [107, 142, 35],
    	"orange": [255, 165, 0],
    	"orangered": [255, 69, 0],
    	"orchid": [218, 112, 214],
    	"palegoldenrod": [238, 232, 170],
    	"palegreen": [152, 251, 152],
    	"paleturquoise": [175, 238, 238],
    	"palevioletred": [219, 112, 147],
    	"papayawhip": [255, 239, 213],
    	"peachpuff": [255, 218, 185],
    	"peru": [205, 133, 63],
    	"pink": [255, 192, 203],
    	"plum": [221, 160, 221],
    	"powderblue": [176, 224, 230],
    	"purple": [128, 0, 128],
    	"rebeccapurple": [102, 51, 153],
    	"red": [255, 0, 0],
    	"rosybrown": [188, 143, 143],
    	"royalblue": [65, 105, 225],
    	"saddlebrown": [139, 69, 19],
    	"salmon": [250, 128, 114],
    	"sandybrown": [244, 164, 96],
    	"seagreen": [46, 139, 87],
    	"seashell": [255, 245, 238],
    	"sienna": [160, 82, 45],
    	"silver": [192, 192, 192],
    	"skyblue": [135, 206, 235],
    	"slateblue": [106, 90, 205],
    	"slategray": [112, 128, 144],
    	"slategrey": [112, 128, 144],
    	"snow": [255, 250, 250],
    	"springgreen": [0, 255, 127],
    	"steelblue": [70, 130, 180],
    	"tan": [210, 180, 140],
    	"teal": [0, 128, 128],
    	"thistle": [216, 191, 216],
    	"tomato": [255, 99, 71],
    	"turquoise": [64, 224, 208],
    	"violet": [238, 130, 238],
    	"wheat": [245, 222, 179],
    	"white": [255, 255, 255],
    	"whitesmoke": [245, 245, 245],
    	"yellow": [255, 255, 0],
    	"yellowgreen": [154, 205, 50]
    };

    var simpleSwizzle = {exports: {}};

    var isArrayish$1 = function isArrayish(obj) {
    	if (!obj || typeof obj === 'string') {
    		return false;
    	}

    	return obj instanceof Array || Array.isArray(obj) ||
    		(obj.length >= 0 && (obj.splice instanceof Function ||
    			(Object.getOwnPropertyDescriptor(obj, (obj.length - 1)) && obj.constructor.name !== 'String')));
    };

    var isArrayish = isArrayish$1;

    var concat = Array.prototype.concat;
    var slice = Array.prototype.slice;

    var swizzle$1 = simpleSwizzle.exports = function swizzle(args) {
    	var results = [];

    	for (var i = 0, len = args.length; i < len; i++) {
    		var arg = args[i];

    		if (isArrayish(arg)) {
    			// http://jsperf.com/javascript-array-concat-vs-push/98
    			results = concat.call(results, slice.call(arg));
    		} else {
    			results.push(arg);
    		}
    	}

    	return results;
    };

    swizzle$1.wrap = function (fn) {
    	return function () {
    		return fn(swizzle$1(arguments));
    	};
    };

    /* MIT license */

    var colorNames = colorName;
    var swizzle = simpleSwizzle.exports;
    var hasOwnProperty = Object.hasOwnProperty;

    var reverseNames = Object.create(null);

    // create a list of reverse color names
    for (var name in colorNames) {
    	if (hasOwnProperty.call(colorNames, name)) {
    		reverseNames[colorNames[name]] = name;
    	}
    }

    var cs = colorString$1.exports = {
    	to: {},
    	get: {}
    };

    cs.get = function (string) {
    	var prefix = string.substring(0, 3).toLowerCase();
    	var val;
    	var model;
    	switch (prefix) {
    		case 'hsl':
    			val = cs.get.hsl(string);
    			model = 'hsl';
    			break;
    		case 'hwb':
    			val = cs.get.hwb(string);
    			model = 'hwb';
    			break;
    		default:
    			val = cs.get.rgb(string);
    			model = 'rgb';
    			break;
    	}

    	if (!val) {
    		return null;
    	}

    	return {model: model, value: val};
    };

    cs.get.rgb = function (string) {
    	if (!string) {
    		return null;
    	}

    	var abbr = /^#([a-f0-9]{3,4})$/i;
    	var hex = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i;
    	var rgba = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/;
    	var per = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/;
    	var keyword = /^(\w+)$/;

    	var rgb = [0, 0, 0, 1];
    	var match;
    	var i;
    	var hexAlpha;

    	if (match = string.match(hex)) {
    		hexAlpha = match[2];
    		match = match[1];

    		for (i = 0; i < 3; i++) {
    			// https://jsperf.com/slice-vs-substr-vs-substring-methods-long-string/19
    			var i2 = i * 2;
    			rgb[i] = parseInt(match.slice(i2, i2 + 2), 16);
    		}

    		if (hexAlpha) {
    			rgb[3] = parseInt(hexAlpha, 16) / 255;
    		}
    	} else if (match = string.match(abbr)) {
    		match = match[1];
    		hexAlpha = match[3];

    		for (i = 0; i < 3; i++) {
    			rgb[i] = parseInt(match[i] + match[i], 16);
    		}

    		if (hexAlpha) {
    			rgb[3] = parseInt(hexAlpha + hexAlpha, 16) / 255;
    		}
    	} else if (match = string.match(rgba)) {
    		for (i = 0; i < 3; i++) {
    			rgb[i] = parseInt(match[i + 1], 0);
    		}

    		if (match[4]) {
    			if (match[5]) {
    				rgb[3] = parseFloat(match[4]) * 0.01;
    			} else {
    				rgb[3] = parseFloat(match[4]);
    			}
    		}
    	} else if (match = string.match(per)) {
    		for (i = 0; i < 3; i++) {
    			rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
    		}

    		if (match[4]) {
    			if (match[5]) {
    				rgb[3] = parseFloat(match[4]) * 0.01;
    			} else {
    				rgb[3] = parseFloat(match[4]);
    			}
    		}
    	} else if (match = string.match(keyword)) {
    		if (match[1] === 'transparent') {
    			return [0, 0, 0, 0];
    		}

    		if (!hasOwnProperty.call(colorNames, match[1])) {
    			return null;
    		}

    		rgb = colorNames[match[1]];
    		rgb[3] = 1;

    		return rgb;
    	} else {
    		return null;
    	}

    	for (i = 0; i < 3; i++) {
    		rgb[i] = clamp(rgb[i], 0, 255);
    	}
    	rgb[3] = clamp(rgb[3], 0, 1);

    	return rgb;
    };

    cs.get.hsl = function (string) {
    	if (!string) {
    		return null;
    	}

    	var hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
    	var match = string.match(hsl);

    	if (match) {
    		var alpha = parseFloat(match[4]);
    		var h = ((parseFloat(match[1]) % 360) + 360) % 360;
    		var s = clamp(parseFloat(match[2]), 0, 100);
    		var l = clamp(parseFloat(match[3]), 0, 100);
    		var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);

    		return [h, s, l, a];
    	}

    	return null;
    };

    cs.get.hwb = function (string) {
    	if (!string) {
    		return null;
    	}

    	var hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
    	var match = string.match(hwb);

    	if (match) {
    		var alpha = parseFloat(match[4]);
    		var h = ((parseFloat(match[1]) % 360) + 360) % 360;
    		var w = clamp(parseFloat(match[2]), 0, 100);
    		var b = clamp(parseFloat(match[3]), 0, 100);
    		var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);
    		return [h, w, b, a];
    	}

    	return null;
    };

    cs.to.hex = function () {
    	var rgba = swizzle(arguments);

    	return (
    		'#' +
    		hexDouble(rgba[0]) +
    		hexDouble(rgba[1]) +
    		hexDouble(rgba[2]) +
    		(rgba[3] < 1
    			? (hexDouble(Math.round(rgba[3] * 255)))
    			: '')
    	);
    };

    cs.to.rgb = function () {
    	var rgba = swizzle(arguments);

    	return rgba.length < 4 || rgba[3] === 1
    		? 'rgb(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ')'
    		: 'rgba(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ', ' + rgba[3] + ')';
    };

    cs.to.rgb.percent = function () {
    	var rgba = swizzle(arguments);

    	var r = Math.round(rgba[0] / 255 * 100);
    	var g = Math.round(rgba[1] / 255 * 100);
    	var b = Math.round(rgba[2] / 255 * 100);

    	return rgba.length < 4 || rgba[3] === 1
    		? 'rgb(' + r + '%, ' + g + '%, ' + b + '%)'
    		: 'rgba(' + r + '%, ' + g + '%, ' + b + '%, ' + rgba[3] + ')';
    };

    cs.to.hsl = function () {
    	var hsla = swizzle(arguments);
    	return hsla.length < 4 || hsla[3] === 1
    		? 'hsl(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%)'
    		: 'hsla(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%, ' + hsla[3] + ')';
    };

    // hwb is a bit different than rgb(a) & hsl(a) since there is no alpha specific syntax
    // (hwb have alpha optional & 1 is default value)
    cs.to.hwb = function () {
    	var hwba = swizzle(arguments);

    	var a = '';
    	if (hwba.length >= 4 && hwba[3] !== 1) {
    		a = ', ' + hwba[3];
    	}

    	return 'hwb(' + hwba[0] + ', ' + hwba[1] + '%, ' + hwba[2] + '%' + a + ')';
    };

    cs.to.keyword = function (rgb) {
    	return reverseNames[rgb.slice(0, 3)];
    };

    // helpers
    function clamp(num, min, max) {
    	return Math.min(Math.max(min, num), max);
    }

    function hexDouble(num) {
    	var str = Math.round(num).toString(16).toUpperCase();
    	return (str.length < 2) ? '0' + str : str;
    }

    /* MIT license */

    /* eslint-disable no-mixed-operators */
    const cssKeywords = colorName;

    // NOTE: conversions should only return primitive values (i.e. arrays, or
    //       values that give correct `typeof` results).
    //       do not use box values types (i.e. Number(), String(), etc.)

    const reverseKeywords = {};
    for (const key of Object.keys(cssKeywords)) {
    	reverseKeywords[cssKeywords[key]] = key;
    }

    const convert$2 = {
    	rgb: {channels: 3, labels: 'rgb'},
    	hsl: {channels: 3, labels: 'hsl'},
    	hsv: {channels: 3, labels: 'hsv'},
    	hwb: {channels: 3, labels: 'hwb'},
    	cmyk: {channels: 4, labels: 'cmyk'},
    	xyz: {channels: 3, labels: 'xyz'},
    	lab: {channels: 3, labels: 'lab'},
    	lch: {channels: 3, labels: 'lch'},
    	hex: {channels: 1, labels: ['hex']},
    	keyword: {channels: 1, labels: ['keyword']},
    	ansi16: {channels: 1, labels: ['ansi16']},
    	ansi256: {channels: 1, labels: ['ansi256']},
    	hcg: {channels: 3, labels: ['h', 'c', 'g']},
    	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
    	gray: {channels: 1, labels: ['gray']}
    };

    var conversions$2 = convert$2;

    // Hide .channels and .labels properties
    for (const model of Object.keys(convert$2)) {
    	if (!('channels' in convert$2[model])) {
    		throw new Error('missing channels property: ' + model);
    	}

    	if (!('labels' in convert$2[model])) {
    		throw new Error('missing channel labels property: ' + model);
    	}

    	if (convert$2[model].labels.length !== convert$2[model].channels) {
    		throw new Error('channel and label counts mismatch: ' + model);
    	}

    	const {channels, labels} = convert$2[model];
    	delete convert$2[model].channels;
    	delete convert$2[model].labels;
    	Object.defineProperty(convert$2[model], 'channels', {value: channels});
    	Object.defineProperty(convert$2[model], 'labels', {value: labels});
    }

    convert$2.rgb.hsl = function (rgb) {
    	const r = rgb[0] / 255;
    	const g = rgb[1] / 255;
    	const b = rgb[2] / 255;
    	const min = Math.min(r, g, b);
    	const max = Math.max(r, g, b);
    	const delta = max - min;
    	let h;
    	let s;

    	if (max === min) {
    		h = 0;
    	} else if (r === max) {
    		h = (g - b) / delta;
    	} else if (g === max) {
    		h = 2 + (b - r) / delta;
    	} else if (b === max) {
    		h = 4 + (r - g) / delta;
    	}

    	h = Math.min(h * 60, 360);

    	if (h < 0) {
    		h += 360;
    	}

    	const l = (min + max) / 2;

    	if (max === min) {
    		s = 0;
    	} else if (l <= 0.5) {
    		s = delta / (max + min);
    	} else {
    		s = delta / (2 - max - min);
    	}

    	return [h, s * 100, l * 100];
    };

    convert$2.rgb.hsv = function (rgb) {
    	let rdif;
    	let gdif;
    	let bdif;
    	let h;
    	let s;

    	const r = rgb[0] / 255;
    	const g = rgb[1] / 255;
    	const b = rgb[2] / 255;
    	const v = Math.max(r, g, b);
    	const diff = v - Math.min(r, g, b);
    	const diffc = function (c) {
    		return (v - c) / 6 / diff + 1 / 2;
    	};

    	if (diff === 0) {
    		h = 0;
    		s = 0;
    	} else {
    		s = diff / v;
    		rdif = diffc(r);
    		gdif = diffc(g);
    		bdif = diffc(b);

    		if (r === v) {
    			h = bdif - gdif;
    		} else if (g === v) {
    			h = (1 / 3) + rdif - bdif;
    		} else if (b === v) {
    			h = (2 / 3) + gdif - rdif;
    		}

    		if (h < 0) {
    			h += 1;
    		} else if (h > 1) {
    			h -= 1;
    		}
    	}

    	return [
    		h * 360,
    		s * 100,
    		v * 100
    	];
    };

    convert$2.rgb.hwb = function (rgb) {
    	const r = rgb[0];
    	const g = rgb[1];
    	let b = rgb[2];
    	const h = convert$2.rgb.hsl(rgb)[0];
    	const w = 1 / 255 * Math.min(r, Math.min(g, b));

    	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

    	return [h, w * 100, b * 100];
    };

    convert$2.rgb.cmyk = function (rgb) {
    	const r = rgb[0] / 255;
    	const g = rgb[1] / 255;
    	const b = rgb[2] / 255;

    	const k = Math.min(1 - r, 1 - g, 1 - b);
    	const c = (1 - r - k) / (1 - k) || 0;
    	const m = (1 - g - k) / (1 - k) || 0;
    	const y = (1 - b - k) / (1 - k) || 0;

    	return [c * 100, m * 100, y * 100, k * 100];
    };

    function comparativeDistance(x, y) {
    	/*
    		See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
    	*/
    	return (
    		((x[0] - y[0]) ** 2) +
    		((x[1] - y[1]) ** 2) +
    		((x[2] - y[2]) ** 2)
    	);
    }

    convert$2.rgb.keyword = function (rgb) {
    	const reversed = reverseKeywords[rgb];
    	if (reversed) {
    		return reversed;
    	}

    	let currentClosestDistance = Infinity;
    	let currentClosestKeyword;

    	for (const keyword of Object.keys(cssKeywords)) {
    		const value = cssKeywords[keyword];

    		// Compute comparative distance
    		const distance = comparativeDistance(rgb, value);

    		// Check if its less, if so set as closest
    		if (distance < currentClosestDistance) {
    			currentClosestDistance = distance;
    			currentClosestKeyword = keyword;
    		}
    	}

    	return currentClosestKeyword;
    };

    convert$2.keyword.rgb = function (keyword) {
    	return cssKeywords[keyword];
    };

    convert$2.rgb.xyz = function (rgb) {
    	let r = rgb[0] / 255;
    	let g = rgb[1] / 255;
    	let b = rgb[2] / 255;

    	// Assume sRGB
    	r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
    	g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
    	b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

    	const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
    	const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
    	const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

    	return [x * 100, y * 100, z * 100];
    };

    convert$2.rgb.lab = function (rgb) {
    	const xyz = convert$2.rgb.xyz(rgb);
    	let x = xyz[0];
    	let y = xyz[1];
    	let z = xyz[2];

    	x /= 95.047;
    	y /= 100;
    	z /= 108.883;

    	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
    	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
    	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

    	const l = (116 * y) - 16;
    	const a = 500 * (x - y);
    	const b = 200 * (y - z);

    	return [l, a, b];
    };

    convert$2.hsl.rgb = function (hsl) {
    	const h = hsl[0] / 360;
    	const s = hsl[1] / 100;
    	const l = hsl[2] / 100;
    	let t2;
    	let t3;
    	let val;

    	if (s === 0) {
    		val = l * 255;
    		return [val, val, val];
    	}

    	if (l < 0.5) {
    		t2 = l * (1 + s);
    	} else {
    		t2 = l + s - l * s;
    	}

    	const t1 = 2 * l - t2;

    	const rgb = [0, 0, 0];
    	for (let i = 0; i < 3; i++) {
    		t3 = h + 1 / 3 * -(i - 1);
    		if (t3 < 0) {
    			t3++;
    		}

    		if (t3 > 1) {
    			t3--;
    		}

    		if (6 * t3 < 1) {
    			val = t1 + (t2 - t1) * 6 * t3;
    		} else if (2 * t3 < 1) {
    			val = t2;
    		} else if (3 * t3 < 2) {
    			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    		} else {
    			val = t1;
    		}

    		rgb[i] = val * 255;
    	}

    	return rgb;
    };

    convert$2.hsl.hsv = function (hsl) {
    	const h = hsl[0];
    	let s = hsl[1] / 100;
    	let l = hsl[2] / 100;
    	let smin = s;
    	const lmin = Math.max(l, 0.01);

    	l *= 2;
    	s *= (l <= 1) ? l : 2 - l;
    	smin *= lmin <= 1 ? lmin : 2 - lmin;
    	const v = (l + s) / 2;
    	const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

    	return [h, sv * 100, v * 100];
    };

    convert$2.hsv.rgb = function (hsv) {
    	const h = hsv[0] / 60;
    	const s = hsv[1] / 100;
    	let v = hsv[2] / 100;
    	const hi = Math.floor(h) % 6;

    	const f = h - Math.floor(h);
    	const p = 255 * v * (1 - s);
    	const q = 255 * v * (1 - (s * f));
    	const t = 255 * v * (1 - (s * (1 - f)));
    	v *= 255;

    	switch (hi) {
    		case 0:
    			return [v, t, p];
    		case 1:
    			return [q, v, p];
    		case 2:
    			return [p, v, t];
    		case 3:
    			return [p, q, v];
    		case 4:
    			return [t, p, v];
    		case 5:
    			return [v, p, q];
    	}
    };

    convert$2.hsv.hsl = function (hsv) {
    	const h = hsv[0];
    	const s = hsv[1] / 100;
    	const v = hsv[2] / 100;
    	const vmin = Math.max(v, 0.01);
    	let sl;
    	let l;

    	l = (2 - s) * v;
    	const lmin = (2 - s) * vmin;
    	sl = s * vmin;
    	sl /= (lmin <= 1) ? lmin : 2 - lmin;
    	sl = sl || 0;
    	l /= 2;

    	return [h, sl * 100, l * 100];
    };

    // http://dev.w3.org/csswg/css-color/#hwb-to-rgb
    convert$2.hwb.rgb = function (hwb) {
    	const h = hwb[0] / 360;
    	let wh = hwb[1] / 100;
    	let bl = hwb[2] / 100;
    	const ratio = wh + bl;
    	let f;

    	// Wh + bl cant be > 1
    	if (ratio > 1) {
    		wh /= ratio;
    		bl /= ratio;
    	}

    	const i = Math.floor(6 * h);
    	const v = 1 - bl;
    	f = 6 * h - i;

    	if ((i & 0x01) !== 0) {
    		f = 1 - f;
    	}

    	const n = wh + f * (v - wh); // Linear interpolation

    	let r;
    	let g;
    	let b;
    	/* eslint-disable max-statements-per-line,no-multi-spaces */
    	switch (i) {
    		default:
    		case 6:
    		case 0: r = v;  g = n;  b = wh; break;
    		case 1: r = n;  g = v;  b = wh; break;
    		case 2: r = wh; g = v;  b = n; break;
    		case 3: r = wh; g = n;  b = v; break;
    		case 4: r = n;  g = wh; b = v; break;
    		case 5: r = v;  g = wh; b = n; break;
    	}
    	/* eslint-enable max-statements-per-line,no-multi-spaces */

    	return [r * 255, g * 255, b * 255];
    };

    convert$2.cmyk.rgb = function (cmyk) {
    	const c = cmyk[0] / 100;
    	const m = cmyk[1] / 100;
    	const y = cmyk[2] / 100;
    	const k = cmyk[3] / 100;

    	const r = 1 - Math.min(1, c * (1 - k) + k);
    	const g = 1 - Math.min(1, m * (1 - k) + k);
    	const b = 1 - Math.min(1, y * (1 - k) + k);

    	return [r * 255, g * 255, b * 255];
    };

    convert$2.xyz.rgb = function (xyz) {
    	const x = xyz[0] / 100;
    	const y = xyz[1] / 100;
    	const z = xyz[2] / 100;
    	let r;
    	let g;
    	let b;

    	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
    	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
    	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

    	// Assume sRGB
    	r = r > 0.0031308
    		? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
    		: r * 12.92;

    	g = g > 0.0031308
    		? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
    		: g * 12.92;

    	b = b > 0.0031308
    		? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
    		: b * 12.92;

    	r = Math.min(Math.max(0, r), 1);
    	g = Math.min(Math.max(0, g), 1);
    	b = Math.min(Math.max(0, b), 1);

    	return [r * 255, g * 255, b * 255];
    };

    convert$2.xyz.lab = function (xyz) {
    	let x = xyz[0];
    	let y = xyz[1];
    	let z = xyz[2];

    	x /= 95.047;
    	y /= 100;
    	z /= 108.883;

    	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
    	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
    	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

    	const l = (116 * y) - 16;
    	const a = 500 * (x - y);
    	const b = 200 * (y - z);

    	return [l, a, b];
    };

    convert$2.lab.xyz = function (lab) {
    	const l = lab[0];
    	const a = lab[1];
    	const b = lab[2];
    	let x;
    	let y;
    	let z;

    	y = (l + 16) / 116;
    	x = a / 500 + y;
    	z = y - b / 200;

    	const y2 = y ** 3;
    	const x2 = x ** 3;
    	const z2 = z ** 3;
    	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
    	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
    	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

    	x *= 95.047;
    	y *= 100;
    	z *= 108.883;

    	return [x, y, z];
    };

    convert$2.lab.lch = function (lab) {
    	const l = lab[0];
    	const a = lab[1];
    	const b = lab[2];
    	let h;

    	const hr = Math.atan2(b, a);
    	h = hr * 360 / 2 / Math.PI;

    	if (h < 0) {
    		h += 360;
    	}

    	const c = Math.sqrt(a * a + b * b);

    	return [l, c, h];
    };

    convert$2.lch.lab = function (lch) {
    	const l = lch[0];
    	const c = lch[1];
    	const h = lch[2];

    	const hr = h / 360 * 2 * Math.PI;
    	const a = c * Math.cos(hr);
    	const b = c * Math.sin(hr);

    	return [l, a, b];
    };

    convert$2.rgb.ansi16 = function (args, saturation = null) {
    	const [r, g, b] = args;
    	let value = saturation === null ? convert$2.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

    	value = Math.round(value / 50);

    	if (value === 0) {
    		return 30;
    	}

    	let ansi = 30
    		+ ((Math.round(b / 255) << 2)
    		| (Math.round(g / 255) << 1)
    		| Math.round(r / 255));

    	if (value === 2) {
    		ansi += 60;
    	}

    	return ansi;
    };

    convert$2.hsv.ansi16 = function (args) {
    	// Optimization here; we already know the value and don't need to get
    	// it converted for us.
    	return convert$2.rgb.ansi16(convert$2.hsv.rgb(args), args[2]);
    };

    convert$2.rgb.ansi256 = function (args) {
    	const r = args[0];
    	const g = args[1];
    	const b = args[2];

    	// We use the extended greyscale palette here, with the exception of
    	// black and white. normal palette only has 4 greyscale shades.
    	if (r === g && g === b) {
    		if (r < 8) {
    			return 16;
    		}

    		if (r > 248) {
    			return 231;
    		}

    		return Math.round(((r - 8) / 247) * 24) + 232;
    	}

    	const ansi = 16
    		+ (36 * Math.round(r / 255 * 5))
    		+ (6 * Math.round(g / 255 * 5))
    		+ Math.round(b / 255 * 5);

    	return ansi;
    };

    convert$2.ansi16.rgb = function (args) {
    	let color = args % 10;

    	// Handle greyscale
    	if (color === 0 || color === 7) {
    		if (args > 50) {
    			color += 3.5;
    		}

    		color = color / 10.5 * 255;

    		return [color, color, color];
    	}

    	const mult = (~~(args > 50) + 1) * 0.5;
    	const r = ((color & 1) * mult) * 255;
    	const g = (((color >> 1) & 1) * mult) * 255;
    	const b = (((color >> 2) & 1) * mult) * 255;

    	return [r, g, b];
    };

    convert$2.ansi256.rgb = function (args) {
    	// Handle greyscale
    	if (args >= 232) {
    		const c = (args - 232) * 10 + 8;
    		return [c, c, c];
    	}

    	args -= 16;

    	let rem;
    	const r = Math.floor(args / 36) / 5 * 255;
    	const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
    	const b = (rem % 6) / 5 * 255;

    	return [r, g, b];
    };

    convert$2.rgb.hex = function (args) {
    	const integer = ((Math.round(args[0]) & 0xFF) << 16)
    		+ ((Math.round(args[1]) & 0xFF) << 8)
    		+ (Math.round(args[2]) & 0xFF);

    	const string = integer.toString(16).toUpperCase();
    	return '000000'.substring(string.length) + string;
    };

    convert$2.hex.rgb = function (args) {
    	const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
    	if (!match) {
    		return [0, 0, 0];
    	}

    	let colorString = match[0];

    	if (match[0].length === 3) {
    		colorString = colorString.split('').map(char => {
    			return char + char;
    		}).join('');
    	}

    	const integer = parseInt(colorString, 16);
    	const r = (integer >> 16) & 0xFF;
    	const g = (integer >> 8) & 0xFF;
    	const b = integer & 0xFF;

    	return [r, g, b];
    };

    convert$2.rgb.hcg = function (rgb) {
    	const r = rgb[0] / 255;
    	const g = rgb[1] / 255;
    	const b = rgb[2] / 255;
    	const max = Math.max(Math.max(r, g), b);
    	const min = Math.min(Math.min(r, g), b);
    	const chroma = (max - min);
    	let grayscale;
    	let hue;

    	if (chroma < 1) {
    		grayscale = min / (1 - chroma);
    	} else {
    		grayscale = 0;
    	}

    	if (chroma <= 0) {
    		hue = 0;
    	} else
    	if (max === r) {
    		hue = ((g - b) / chroma) % 6;
    	} else
    	if (max === g) {
    		hue = 2 + (b - r) / chroma;
    	} else {
    		hue = 4 + (r - g) / chroma;
    	}

    	hue /= 6;
    	hue %= 1;

    	return [hue * 360, chroma * 100, grayscale * 100];
    };

    convert$2.hsl.hcg = function (hsl) {
    	const s = hsl[1] / 100;
    	const l = hsl[2] / 100;

    	const c = l < 0.5 ? (2.0 * s * l) : (2.0 * s * (1.0 - l));

    	let f = 0;
    	if (c < 1.0) {
    		f = (l - 0.5 * c) / (1.0 - c);
    	}

    	return [hsl[0], c * 100, f * 100];
    };

    convert$2.hsv.hcg = function (hsv) {
    	const s = hsv[1] / 100;
    	const v = hsv[2] / 100;

    	const c = s * v;
    	let f = 0;

    	if (c < 1.0) {
    		f = (v - c) / (1 - c);
    	}

    	return [hsv[0], c * 100, f * 100];
    };

    convert$2.hcg.rgb = function (hcg) {
    	const h = hcg[0] / 360;
    	const c = hcg[1] / 100;
    	const g = hcg[2] / 100;

    	if (c === 0.0) {
    		return [g * 255, g * 255, g * 255];
    	}

    	const pure = [0, 0, 0];
    	const hi = (h % 1) * 6;
    	const v = hi % 1;
    	const w = 1 - v;
    	let mg = 0;

    	/* eslint-disable max-statements-per-line */
    	switch (Math.floor(hi)) {
    		case 0:
    			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
    		case 1:
    			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
    		case 2:
    			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
    		case 3:
    			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
    		case 4:
    			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
    		default:
    			pure[0] = 1; pure[1] = 0; pure[2] = w;
    	}
    	/* eslint-enable max-statements-per-line */

    	mg = (1.0 - c) * g;

    	return [
    		(c * pure[0] + mg) * 255,
    		(c * pure[1] + mg) * 255,
    		(c * pure[2] + mg) * 255
    	];
    };

    convert$2.hcg.hsv = function (hcg) {
    	const c = hcg[1] / 100;
    	const g = hcg[2] / 100;

    	const v = c + g * (1.0 - c);
    	let f = 0;

    	if (v > 0.0) {
    		f = c / v;
    	}

    	return [hcg[0], f * 100, v * 100];
    };

    convert$2.hcg.hsl = function (hcg) {
    	const c = hcg[1] / 100;
    	const g = hcg[2] / 100;

    	const l = g * (1.0 - c) + 0.5 * c;
    	let s = 0;

    	if (l > 0.0 && l < 0.5) {
    		s = c / (2 * l);
    	} else
    	if (l >= 0.5 && l < 1.0) {
    		s = c / (2 * (1 - l));
    	}

    	return [hcg[0], s * 100, l * 100];
    };

    convert$2.hcg.hwb = function (hcg) {
    	const c = hcg[1] / 100;
    	const g = hcg[2] / 100;
    	const v = c + g * (1.0 - c);
    	return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };

    convert$2.hwb.hcg = function (hwb) {
    	const w = hwb[1] / 100;
    	const b = hwb[2] / 100;
    	const v = 1 - b;
    	const c = v - w;
    	let g = 0;

    	if (c < 1) {
    		g = (v - c) / (1 - c);
    	}

    	return [hwb[0], c * 100, g * 100];
    };

    convert$2.apple.rgb = function (apple) {
    	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
    };

    convert$2.rgb.apple = function (rgb) {
    	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
    };

    convert$2.gray.rgb = function (args) {
    	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };

    convert$2.gray.hsl = function (args) {
    	return [0, 0, args[0]];
    };

    convert$2.gray.hsv = convert$2.gray.hsl;

    convert$2.gray.hwb = function (gray) {
    	return [0, 100, gray[0]];
    };

    convert$2.gray.cmyk = function (gray) {
    	return [0, 0, 0, gray[0]];
    };

    convert$2.gray.lab = function (gray) {
    	return [gray[0], 0, 0];
    };

    convert$2.gray.hex = function (gray) {
    	const val = Math.round(gray[0] / 100 * 255) & 0xFF;
    	const integer = (val << 16) + (val << 8) + val;

    	const string = integer.toString(16).toUpperCase();
    	return '000000'.substring(string.length) + string;
    };

    convert$2.rgb.gray = function (rgb) {
    	const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
    	return [val / 255 * 100];
    };

    const conversions$1 = conversions$2;

    /*
    	This function routes a model to all other models.

    	all functions that are routed have a property `.conversion` attached
    	to the returned synthetic function. This property is an array
    	of strings, each with the steps in between the 'from' and 'to'
    	color models (inclusive).

    	conversions that are not possible simply are not included.
    */

    function buildGraph() {
    	const graph = {};
    	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
    	const models = Object.keys(conversions$1);

    	for (let len = models.length, i = 0; i < len; i++) {
    		graph[models[i]] = {
    			// http://jsperf.com/1-vs-infinity
    			// micro-opt, but this is simple.
    			distance: -1,
    			parent: null
    		};
    	}

    	return graph;
    }

    // https://en.wikipedia.org/wiki/Breadth-first_search
    function deriveBFS(fromModel) {
    	const graph = buildGraph();
    	const queue = [fromModel]; // Unshift -> queue -> pop

    	graph[fromModel].distance = 0;

    	while (queue.length) {
    		const current = queue.pop();
    		const adjacents = Object.keys(conversions$1[current]);

    		for (let len = adjacents.length, i = 0; i < len; i++) {
    			const adjacent = adjacents[i];
    			const node = graph[adjacent];

    			if (node.distance === -1) {
    				node.distance = graph[current].distance + 1;
    				node.parent = current;
    				queue.unshift(adjacent);
    			}
    		}
    	}

    	return graph;
    }

    function link(from, to) {
    	return function (args) {
    		return to(from(args));
    	};
    }

    function wrapConversion(toModel, graph) {
    	const path = [graph[toModel].parent, toModel];
    	let fn = conversions$1[graph[toModel].parent][toModel];

    	let cur = graph[toModel].parent;
    	while (graph[cur].parent) {
    		path.unshift(graph[cur].parent);
    		fn = link(conversions$1[graph[cur].parent][cur], fn);
    		cur = graph[cur].parent;
    	}

    	fn.conversion = path;
    	return fn;
    }

    var route$1 = function (fromModel) {
    	const graph = deriveBFS(fromModel);
    	const conversion = {};

    	const models = Object.keys(graph);
    	for (let len = models.length, i = 0; i < len; i++) {
    		const toModel = models[i];
    		const node = graph[toModel];

    		if (node.parent === null) {
    			// No possible conversion, or this node is the source model.
    			continue;
    		}

    		conversion[toModel] = wrapConversion(toModel, graph);
    	}

    	return conversion;
    };

    const conversions = conversions$2;
    const route = route$1;

    const convert$1 = {};

    const models = Object.keys(conversions);

    function wrapRaw(fn) {
    	const wrappedFn = function (...args) {
    		const arg0 = args[0];
    		if (arg0 === undefined || arg0 === null) {
    			return arg0;
    		}

    		if (arg0.length > 1) {
    			args = arg0;
    		}

    		return fn(args);
    	};

    	// Preserve .conversion property if there is one
    	if ('conversion' in fn) {
    		wrappedFn.conversion = fn.conversion;
    	}

    	return wrappedFn;
    }

    function wrapRounded(fn) {
    	const wrappedFn = function (...args) {
    		const arg0 = args[0];

    		if (arg0 === undefined || arg0 === null) {
    			return arg0;
    		}

    		if (arg0.length > 1) {
    			args = arg0;
    		}

    		const result = fn(args);

    		// We're assuming the result is an array here.
    		// see notice in conversions.js; don't use box types
    		// in conversion functions.
    		if (typeof result === 'object') {
    			for (let len = result.length, i = 0; i < len; i++) {
    				result[i] = Math.round(result[i]);
    			}
    		}

    		return result;
    	};

    	// Preserve .conversion property if there is one
    	if ('conversion' in fn) {
    		wrappedFn.conversion = fn.conversion;
    	}

    	return wrappedFn;
    }

    models.forEach(fromModel => {
    	convert$1[fromModel] = {};

    	Object.defineProperty(convert$1[fromModel], 'channels', {value: conversions[fromModel].channels});
    	Object.defineProperty(convert$1[fromModel], 'labels', {value: conversions[fromModel].labels});

    	const routes = route(fromModel);
    	const routeModels = Object.keys(routes);

    	routeModels.forEach(toModel => {
    		const fn = routes[toModel];

    		convert$1[fromModel][toModel] = wrapRounded(fn);
    		convert$1[fromModel][toModel].raw = wrapRaw(fn);
    	});
    });

    var colorConvert = convert$1;

    const colorString = colorString$1.exports;
    const convert = colorConvert;

    const skippedModels = [
    	// To be honest, I don't really feel like keyword belongs in color convert, but eh.
    	'keyword',

    	// Gray conflicts with some method names, and has its own method defined.
    	'gray',

    	// Shouldn't really be in color-convert either...
    	'hex',
    ];

    const hashedModelKeys = {};
    for (const model of Object.keys(convert)) {
    	hashedModelKeys[[...convert[model].labels].sort().join('')] = model;
    }

    const limiters = {};

    function Color(object, model) {
    	if (!(this instanceof Color)) {
    		return new Color(object, model);
    	}

    	if (model && model in skippedModels) {
    		model = null;
    	}

    	if (model && !(model in convert)) {
    		throw new Error('Unknown model: ' + model);
    	}

    	let i;
    	let channels;

    	if (object == null) { // eslint-disable-line no-eq-null,eqeqeq
    		this.model = 'rgb';
    		this.color = [0, 0, 0];
    		this.valpha = 1;
    	} else if (object instanceof Color) {
    		this.model = object.model;
    		this.color = [...object.color];
    		this.valpha = object.valpha;
    	} else if (typeof object === 'string') {
    		const result = colorString.get(object);
    		if (result === null) {
    			throw new Error('Unable to parse color from string: ' + object);
    		}

    		this.model = result.model;
    		channels = convert[this.model].channels;
    		this.color = result.value.slice(0, channels);
    		this.valpha = typeof result.value[channels] === 'number' ? result.value[channels] : 1;
    	} else if (object.length > 0) {
    		this.model = model || 'rgb';
    		channels = convert[this.model].channels;
    		const newArray = Array.prototype.slice.call(object, 0, channels);
    		this.color = zeroArray(newArray, channels);
    		this.valpha = typeof object[channels] === 'number' ? object[channels] : 1;
    	} else if (typeof object === 'number') {
    		// This is always RGB - can be converted later on.
    		this.model = 'rgb';
    		this.color = [
    			(object >> 16) & 0xFF,
    			(object >> 8) & 0xFF,
    			object & 0xFF,
    		];
    		this.valpha = 1;
    	} else {
    		this.valpha = 1;

    		const keys = Object.keys(object);
    		if ('alpha' in object) {
    			keys.splice(keys.indexOf('alpha'), 1);
    			this.valpha = typeof object.alpha === 'number' ? object.alpha : 0;
    		}

    		const hashedKeys = keys.sort().join('');
    		if (!(hashedKeys in hashedModelKeys)) {
    			throw new Error('Unable to parse color from object: ' + JSON.stringify(object));
    		}

    		this.model = hashedModelKeys[hashedKeys];

    		const {labels} = convert[this.model];
    		const color = [];
    		for (i = 0; i < labels.length; i++) {
    			color.push(object[labels[i]]);
    		}

    		this.color = zeroArray(color);
    	}

    	// Perform limitations (clamping, etc.)
    	if (limiters[this.model]) {
    		channels = convert[this.model].channels;
    		for (i = 0; i < channels; i++) {
    			const limit = limiters[this.model][i];
    			if (limit) {
    				this.color[i] = limit(this.color[i]);
    			}
    		}
    	}

    	this.valpha = Math.max(0, Math.min(1, this.valpha));

    	if (Object.freeze) {
    		Object.freeze(this);
    	}
    }

    Color.prototype = {
    	toString() {
    		return this.string();
    	},

    	toJSON() {
    		return this[this.model]();
    	},

    	string(places) {
    		let self = this.model in colorString.to ? this : this.rgb();
    		self = self.round(typeof places === 'number' ? places : 1);
    		const args = self.valpha === 1 ? self.color : [...self.color, this.valpha];
    		return colorString.to[self.model](args);
    	},

    	percentString(places) {
    		const self = this.rgb().round(typeof places === 'number' ? places : 1);
    		const args = self.valpha === 1 ? self.color : [...self.color, this.valpha];
    		return colorString.to.rgb.percent(args);
    	},

    	array() {
    		return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha];
    	},

    	object() {
    		const result = {};
    		const {channels} = convert[this.model];
    		const {labels} = convert[this.model];

    		for (let i = 0; i < channels; i++) {
    			result[labels[i]] = this.color[i];
    		}

    		if (this.valpha !== 1) {
    			result.alpha = this.valpha;
    		}

    		return result;
    	},

    	unitArray() {
    		const rgb = this.rgb().color;
    		rgb[0] /= 255;
    		rgb[1] /= 255;
    		rgb[2] /= 255;

    		if (this.valpha !== 1) {
    			rgb.push(this.valpha);
    		}

    		return rgb;
    	},

    	unitObject() {
    		const rgb = this.rgb().object();
    		rgb.r /= 255;
    		rgb.g /= 255;
    		rgb.b /= 255;

    		if (this.valpha !== 1) {
    			rgb.alpha = this.valpha;
    		}

    		return rgb;
    	},

    	round(places) {
    		places = Math.max(places || 0, 0);
    		return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model);
    	},

    	alpha(value) {
    		if (value !== undefined) {
    			return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model);
    		}

    		return this.valpha;
    	},

    	// Rgb
    	red: getset('rgb', 0, maxfn(255)),
    	green: getset('rgb', 1, maxfn(255)),
    	blue: getset('rgb', 2, maxfn(255)),

    	hue: getset(['hsl', 'hsv', 'hsl', 'hwb', 'hcg'], 0, value => ((value % 360) + 360) % 360),

    	saturationl: getset('hsl', 1, maxfn(100)),
    	lightness: getset('hsl', 2, maxfn(100)),

    	saturationv: getset('hsv', 1, maxfn(100)),
    	value: getset('hsv', 2, maxfn(100)),

    	chroma: getset('hcg', 1, maxfn(100)),
    	gray: getset('hcg', 2, maxfn(100)),

    	white: getset('hwb', 1, maxfn(100)),
    	wblack: getset('hwb', 2, maxfn(100)),

    	cyan: getset('cmyk', 0, maxfn(100)),
    	magenta: getset('cmyk', 1, maxfn(100)),
    	yellow: getset('cmyk', 2, maxfn(100)),
    	black: getset('cmyk', 3, maxfn(100)),

    	x: getset('xyz', 0, maxfn(95.047)),
    	y: getset('xyz', 1, maxfn(100)),
    	z: getset('xyz', 2, maxfn(108.833)),

    	l: getset('lab', 0, maxfn(100)),
    	a: getset('lab', 1),
    	b: getset('lab', 2),

    	keyword(value) {
    		if (value !== undefined) {
    			return new Color(value);
    		}

    		return convert[this.model].keyword(this.color);
    	},

    	hex(value) {
    		if (value !== undefined) {
    			return new Color(value);
    		}

    		return colorString.to.hex(this.rgb().round().color);
    	},

    	hexa(value) {
    		if (value !== undefined) {
    			return new Color(value);
    		}

    		const rgbArray = this.rgb().round().color;

    		let alphaHex = Math.round(this.valpha * 255).toString(16).toUpperCase();
    		if (alphaHex.length === 1) {
    			alphaHex = '0' + alphaHex;
    		}

    		return colorString.to.hex(rgbArray) + alphaHex;
    	},

    	rgbNumber() {
    		const rgb = this.rgb().color;
    		return ((rgb[0] & 0xFF) << 16) | ((rgb[1] & 0xFF) << 8) | (rgb[2] & 0xFF);
    	},

    	luminosity() {
    		// http://www.w3.org/TR/WCAG20/#relativeluminancedef
    		const rgb = this.rgb().color;

    		const lum = [];
    		for (const [i, element] of rgb.entries()) {
    			const chan = element / 255;
    			lum[i] = (chan <= 0.04045) ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4;
    		}

    		return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
    	},

    	contrast(color2) {
    		// http://www.w3.org/TR/WCAG20/#contrast-ratiodef
    		const lum1 = this.luminosity();
    		const lum2 = color2.luminosity();

    		if (lum1 > lum2) {
    			return (lum1 + 0.05) / (lum2 + 0.05);
    		}

    		return (lum2 + 0.05) / (lum1 + 0.05);
    	},

    	level(color2) {
    		// https://www.w3.org/TR/WCAG/#contrast-enhanced
    		const contrastRatio = this.contrast(color2);
    		if (contrastRatio >= 7) {
    			return 'AAA';
    		}

    		return (contrastRatio >= 4.5) ? 'AA' : '';
    	},

    	isDark() {
    		// YIQ equation from http://24ways.org/2010/calculating-color-contrast
    		const rgb = this.rgb().color;
    		const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 10000;
    		return yiq < 128;
    	},

    	isLight() {
    		return !this.isDark();
    	},

    	negate() {
    		const rgb = this.rgb();
    		for (let i = 0; i < 3; i++) {
    			rgb.color[i] = 255 - rgb.color[i];
    		}

    		return rgb;
    	},

    	lighten(ratio) {
    		const hsl = this.hsl();
    		hsl.color[2] += hsl.color[2] * ratio;
    		return hsl;
    	},

    	darken(ratio) {
    		const hsl = this.hsl();
    		hsl.color[2] -= hsl.color[2] * ratio;
    		return hsl;
    	},

    	saturate(ratio) {
    		const hsl = this.hsl();
    		hsl.color[1] += hsl.color[1] * ratio;
    		return hsl;
    	},

    	desaturate(ratio) {
    		const hsl = this.hsl();
    		hsl.color[1] -= hsl.color[1] * ratio;
    		return hsl;
    	},

    	whiten(ratio) {
    		const hwb = this.hwb();
    		hwb.color[1] += hwb.color[1] * ratio;
    		return hwb;
    	},

    	blacken(ratio) {
    		const hwb = this.hwb();
    		hwb.color[2] += hwb.color[2] * ratio;
    		return hwb;
    	},

    	grayscale() {
    		// http://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale
    		const rgb = this.rgb().color;
    		const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
    		return Color.rgb(value, value, value);
    	},

    	fade(ratio) {
    		return this.alpha(this.valpha - (this.valpha * ratio));
    	},

    	opaquer(ratio) {
    		return this.alpha(this.valpha + (this.valpha * ratio));
    	},

    	rotate(degrees) {
    		const hsl = this.hsl();
    		let hue = hsl.color[0];
    		hue = (hue + degrees) % 360;
    		hue = hue < 0 ? 360 + hue : hue;
    		hsl.color[0] = hue;
    		return hsl;
    	},

    	mix(mixinColor, weight) {
    		// Ported from sass implementation in C
    		// https://github.com/sass/libsass/blob/0e6b4a2850092356aa3ece07c6b249f0221caced/functions.cpp#L209
    		if (!mixinColor || !mixinColor.rgb) {
    			throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
    		}

    		const color1 = mixinColor.rgb();
    		const color2 = this.rgb();
    		const p = weight === undefined ? 0.5 : weight;

    		const w = 2 * p - 1;
    		const a = color1.alpha() - color2.alpha();

    		const w1 = (((w * a === -1) ? w : (w + a) / (1 + w * a)) + 1) / 2;
    		const w2 = 1 - w1;

    		return Color.rgb(
    			w1 * color1.red() + w2 * color2.red(),
    			w1 * color1.green() + w2 * color2.green(),
    			w1 * color1.blue() + w2 * color2.blue(),
    			color1.alpha() * p + color2.alpha() * (1 - p));
    	},
    };

    // Model conversion methods and static constructors
    for (const model of Object.keys(convert)) {
    	if (skippedModels.includes(model)) {
    		continue;
    	}

    	const {channels} = convert[model];

    	// Conversion methods
    	Color.prototype[model] = function (...args) {
    		if (this.model === model) {
    			return new Color(this);
    		}

    		if (args.length > 0) {
    			return new Color(args, model);
    		}

    		return new Color([...assertArray(convert[this.model][model].raw(this.color)), this.valpha], model);
    	};

    	// 'static' construction methods
    	Color[model] = function (...args) {
    		let color = args[0];
    		if (typeof color === 'number') {
    			color = zeroArray(args, channels);
    		}

    		return new Color(color, model);
    	};
    }

    function roundTo(number, places) {
    	return Number(number.toFixed(places));
    }

    function roundToPlace(places) {
    	return function (number) {
    		return roundTo(number, places);
    	};
    }

    function getset(model, channel, modifier) {
    	model = Array.isArray(model) ? model : [model];

    	for (const m of model) {
    		(limiters[m] || (limiters[m] = []))[channel] = modifier;
    	}

    	model = model[0];

    	return function (value) {
    		let result;

    		if (value !== undefined) {
    			if (modifier) {
    				value = modifier(value);
    			}

    			result = this[model]();
    			result.color[channel] = value;
    			return result;
    		}

    		result = this[model]().color[channel];
    		if (modifier) {
    			result = modifier(result);
    		}

    		return result;
    	};
    }

    function maxfn(max) {
    	return function (v) {
    		return Math.max(0, Math.min(max, v));
    	};
    }

    function assertArray(value) {
    	return Array.isArray(value) ? value : [value];
    }

    function zeroArray(array, length) {
    	for (let i = 0; i < length; i++) {
    		if (typeof array[i] !== 'number') {
    			array[i] = 0;
    		}
    	}

    	return array;
    }

    var color = Color;

    // https://stackblitz.com/edit/angular-3ph3on?file=src%2Fapp%2Fapp.component.ts
    function saveCssShadeStyleVariables(c, s, opposite) {
        for (const { value, name } of computeColors(c, opposite)) {
            document.documentElement.style.setProperty(`${s}${name}`, value);
        }
    }
    // @ts-ignore
    window.colors = saveCssShadeStyleVariables;
    // https://gist.github.com/jedfoster/7939513
    const mix = function (color_1, color_2, weight) {
        function d2h(d) {
            return d.toString(16);
        } // convert a decimal value to hex
        function h2d(h) {
            return parseInt(h, 16);
        } // convert a hex value to decimal
        weight = typeof weight !== 'undefined' ? weight : 50; // set the weight to 50%, if that argument is omitted
        let color = '#';
        for (let i = 0; i <= 5; i += 2) {
            // loop through each of the 3 hex pairs—red, green, and blue
            let v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
            v2 = h2d(color_2.substr(i, 2)), 
            // combine the current pairs from each source color, according to the specified weight
            val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)));
            while (val.length < 2) {
                val = '0' + val;
            } // prepend a '0' if val results in a single digit
            color += val; // concatenate val to our new color string
        }
        return color; // PROFIT!
    };
    function multiply(rgb1, rgb2) {
        var result = [], i = 0;
        for (; i < rgb1.length; i++) {
            result.push(Math.floor((rgb1[i] * rgb2[i]) / 255));
        }
        return result;
    }
    function computeColors(c, opposite) {
        const rgb = color(c).rgb().array();
        const color$1 = color(c).hex().substring(1);
        const light = opposite.substring(1);
        const dark = color(multiply(rgb, rgb)).hex().substring(1);
        document.documentElement.style.setProperty(`--ddm-theme`, light);
        return [
            _(mix(light, color$1, 89), '50'),
            _(mix(light, color$1, 71), '100'),
            _(mix(light, color$1, 50), '200'),
            _(mix(light, color$1, 30), '300'),
            _(mix(light, color$1, 16), '400'),
            _(mix(light, color$1, 0), '500'),
            _(mix(dark, color$1, 13), '600'),
            _(mix(dark, color$1, 30), '700'),
            _(mix(dark, color$1, 46), '800'),
            _(mix(dark, color$1, 75), '900'),
            // A100: lighten(saturate(mix(dark, color, 15%), 80%), 45.6%),
            // A200: lighten(saturate(mix(dark, color, 15%), 80%), 35.6%),
            // A400: lighten(saturate(mix(dark, color, 15%), 100%), 25.6%),
            // A700: lighten(saturate(mix(dark, color, 15%), 100%), 20.5%),
            //
            // _(tinycolor(color).lighten(52), '50'),
            // _(tinycolor(color).lighten(37), '100'),
            // _(tinycolor(color).lighten(26), '200'),
            // _(tinycolor(color).lighten(12), '300'),
            // _(tinycolor(color).lighten(6), '400'),
            // _(tinycolor(color), '500'),
            // _(tinycolor(color).darken(6), '600'),
            // _(tinycolor(color).darken(12), '700'),
            // _(tinycolor(color).darken(18), '800'),
            // _(tinycolor(color).darken(24), '900'),
            _(tinycolor(c).lighten(50).saturate(30), 'A100'),
            _(tinycolor(c).lighten(30).saturate(30), 'A200'),
            _(tinycolor(c).lighten(10).saturate(15), 'A400'),
            _(tinycolor(c).lighten(5).saturate(5), 'A700'),
        ];
    }
    function _(value, name) {
        return {
            value: value,
            name,
        };
    }

    var _a;
    // User/JWT-related
    // https://stackoverflow.com/a/61300826/2933427
    const createWritableStore = (key, startValue) => {
        const { subscribe, set, update } = writable(startValue);
        return {
            subscribe,
            set,
            update,
            reset: set(startValue),
            useLocalStorage: () => {
                const json = localStorage.getItem(key);
                if (json) {
                    set(JSON.parse(json));
                }
                subscribe(current => {
                    localStorage.setItem(key, JSON.stringify(current));
                });
            },
        };
    };
    // Theme / Color
    const placeholder = {
        theme: 'dark',
        pallet: {
            light: { color: '#e8e8e8', accent: '#5c7080', opposite: '#000000' },
            dark: { color: '#1a1a1a', accent: '#5c7080', opposite: '#ffffff' },
        },
    };
    const store = () => {
        if ('yt-gif-theme' in localStorage) {
            return JSON.parse(localStorage.getItem('yt-gif-theme'));
        }
    };
    const themeStore = createWritableStore('yt-gif-theme', (_a = store()) !== null && _a !== void 0 ? _a : placeholder);
    const useDmmVars = createWritableStore('use-ddm-vars', true);
    const UpdateCssVars = (theme) => {
        const value = get_store_value(themeStore).pallet[theme].color;
        const opposite = get_store_value(themeStore).pallet[theme].opposite;
        saveCssShadeStyleVariables(value, '--ddm-', opposite);
    };
    // @ts-ignore
    window.updateColor = UpdateCssVars;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const useDdmVars = (e, b) => {
        document.documentElement.classList.toggle('use-ddm-vars', e ? e.currentTarget.checked : b);
    };

    function throttle(func, timeFrame) {
      let lastTime = 0;
      return function (...args) {
        let now = new Date();
        if (now - lastTime >= timeFrame) {
          func(...args);
          lastTime = now;
        }
      };
    }

    function getRowsCount(items, cols) {
      const getItemsMaxHeight = items.map((val) => {
        const item = val[cols];

        return (item && item.y) + (item && item.h) || 0;
      });

      return Math.max(...getItemsMaxHeight, 1);
    }

    const getColumn = (containerWidth, columns) => {
      const sortColumns = columns.slice().sort((a, b) => a[0] - b[0]);

      const breakpoint = sortColumns.find((value) => {
        const [width] = value;
        return containerWidth <= width;
      });

      if (breakpoint) {
        return breakpoint[1];
      } else {
        return sortColumns[sortColumns.length - 1][1];
      }
    };

    function getContainerHeight(items, yPerPx, cols) {
      return getRowsCount(items, cols) * yPerPx;
    }

    const makeMatrix = (rows, cols) => Array.from(Array(rows), () => new Array(cols)); // make 2d array

    function makeMatrixFromItems(items, _row, _col) {
      let matrix = makeMatrix(_row, _col);

      for (var i = 0; i < items.length; i++) {
        const value = items[i][_col];
        if (value) {
          const { x, y, h } = value;
          const id = items[i].id;
          const w = Math.min(_col, value.w);

          for (var j = y; j < y + h; j++) {
            const row = matrix[j];
            for (var k = x; k < x + w; k++) {
              row[k] = { ...value, id };
            }
          }
        }
      }
      return matrix;
    }

    function findCloseBlocks(items, matrix, curObject) {
      const { h, x, y } = curObject;

      const w = Math.min(matrix[0].length, curObject.w);
      const tempR = matrix.slice(y, y + h);

      let result = [];
      for (var i = 0; i < tempR.length; i++) {
        let tempA = tempR[i].slice(x, x + w);
        result = [...result, ...tempA.map((val) => val.id && val.id !== curObject.id && val.id).filter(Boolean)];
      }

      return [...new Set(result)];
    }

    function makeMatrixFromItemsIgnore(items, ignoreList, _row, _col) {
      let matrix = makeMatrix(_row, _col);
      for (var i = 0; i < items.length; i++) {
        const value = items[i][_col];
        const id = items[i].id;
        const { x, y, h } = value;
        const w = Math.min(_col, value.w);

        if (ignoreList.indexOf(id) === -1) {
          for (var j = y; j < y + h; j++) {
            const row = matrix[j];
            if (row) {
              for (var k = x; k < x + w; k++) {
                row[k] = { ...value, id };
              }
            }
          }
        }
      }
      return matrix;
    }

    function findItemsById(closeBlocks, items) {
      return items.filter((value) => closeBlocks.indexOf(value.id) !== -1);
    }

    function getItemById(id, items) {
      return items.find((value) => value.id === id);
    }

    function findFreeSpaceForItem(matrix, item) {
      const cols = matrix[0].length;
      const w = Math.min(cols, item.w);
      let xNtime = cols - w;
      let getMatrixRows = matrix.length;

      for (var i = 0; i < getMatrixRows; i++) {
        const row = matrix[i];
        for (var j = 0; j < xNtime + 1; j++) {
          const sliceA = row.slice(j, j + w);
          const empty = sliceA.every((val) => val === undefined);
          if (empty) {
            const isEmpty = matrix.slice(i, i + item.h).every((a) => a.slice(j, j + w).every((n) => n === undefined));

            if (isEmpty) {
              return { y: i, x: j };
            }
          }
        }
      }

      return {
        y: getMatrixRows,
        x: 0,
      };
    }

    const getItem = (item, col) => {
      return { ...item[col], id: item.id };
    };

    const updateItem = (elements, active, position, col) => {
      return elements.map((value) => {
        if (value.id === active.id) {
          return { ...value, [col]: { ...value[col], ...position } };
        }
        return value;
      });
    };

    function moveItemsAroundItem(active, items, cols, original) {
      // Get current item from the breakpoint
      const activeItem = getItem(active, cols);
      const ids = items.map((value) => value.id).filter((value) => value !== activeItem.id);

      const els = items.filter((value) => value.id !== activeItem.id);

      // Update items
      let newItems = updateItem(items, active, activeItem, cols);

      let matrix = makeMatrixFromItemsIgnore(newItems, ids, getRowsCount(newItems, cols), cols);
      let tempItems = newItems;

      // Exclude resolved elements ids in array
      let exclude = [];

      els.forEach((item) => {
        // Find position for element
        let position = findFreeSpaceForItem(matrix, item[cols]);
        // Exclude item
        exclude.push(item.id);

        tempItems = updateItem(tempItems, item, position, cols);

        // Recreate ids of elements
        let getIgnoreItems = ids.filter((value) => exclude.indexOf(value) === -1);

        // Update matrix for next iteration
        matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
      });

      // Return result
      return tempItems;
    }

    function moveItem(active, items, cols, original) {
      // Get current item from the breakpoint
      const item = getItem(active, cols);

      // Create matrix from the items expect the active
      let matrix = makeMatrixFromItemsIgnore(items, [item.id], getRowsCount(items, cols), cols);
      // Getting the ids of items under active Array<String>
      const closeBlocks = findCloseBlocks(items, matrix, item);
      // Getting the objects of items under active Array<Object>
      let closeObj = findItemsById(closeBlocks, items);
      // Getting whenever of these items is fixed
      const fixed = closeObj.find((value) => value[cols].fixed);

      // If found fixed, reset the active to its original position
      if (fixed) return items;

      // Update items
      items = updateItem(items, active, item, cols);

      // Create matrix of items expect close elements
      matrix = makeMatrixFromItemsIgnore(items, closeBlocks, getRowsCount(items, cols), cols);

      // Create temp vars
      let tempItems = items;
      let tempCloseBlocks = closeBlocks;

      // Exclude resolved elements ids in array
      let exclude = [];

      // Iterate over close elements under active item
      closeObj.forEach((item) => {
        // Find position for element
        let position = findFreeSpaceForItem(matrix, item[cols]);
        // Exclude item
        exclude.push(item.id);

        // Assign the position to the element in the column
        tempItems = updateItem(tempItems, item, position, cols);

        // Recreate ids of elements
        let getIgnoreItems = tempCloseBlocks.filter((value) => exclude.indexOf(value) === -1);

        // Update matrix for next iteration
        matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
      });

      // Return result
      return tempItems;
    }

    // Helper function
    function normalize(items, col) {
      let result = items.slice();

      result.forEach((value) => {
        const getItem = value[col];
        if (!getItem.static) {
          result = moveItem(getItem, result, col, { ...getItem });
        }
      });

      return result;
    }

    // Helper function
    function adjust(items, col) {
      let matrix = makeMatrix(getRowsCount(items, col), col);

      let res = [];

      items.forEach((item) => {
        let position = findFreeSpaceForItem(matrix, item[col]);

        res.push({
          ...item,
          [col]: {
            ...item[col],
            ...position,
          },
        });

        matrix = makeMatrixFromItems(res, getRowsCount(res, col), col);
      });

      return res;
    }

    function getUndefinedItems(items, col, breakpoints) {
      return items
        .map((value) => {
          if (!value[col]) {
            return value.id;
          }
        })
        .filter(Boolean);
    }

    function getClosestColumn(items, item, col, breakpoints) {
      return breakpoints
        .map(([_, column]) => item[column] && column)
        .filter(Boolean)
        .reduce(function (acc, value) {
          const isLower = Math.abs(value - col) < Math.abs(acc - col);

          return isLower ? value : acc;
        });
    }

    function specifyUndefinedColumns(items, col, breakpoints) {
      let matrix = makeMatrixFromItems(items, getRowsCount(items, col), col);

      const getUndefinedElements = getUndefinedItems(items, col);

      let newItems = [...items];

      getUndefinedElements.forEach((elementId) => {
        const getElement = items.find((item) => item.id === elementId);

        const closestColumn = getClosestColumn(items, getElement, col, breakpoints);

        const position = findFreeSpaceForItem(matrix, getElement[closestColumn]);

        const newItem = {
          ...getElement,
          [col]: {
            ...getElement[closestColumn],
            ...position,
          },
        };

        newItems = newItems.map((value) => (value.id === elementId ? newItem : value));

        matrix = makeMatrixFromItems(newItems, getRowsCount(newItems, col), col);
      });
      return newItems;
    }

    /* node_modules\.pnpm\svelte-grid@5.1.1\node_modules\svelte-grid\src\MoveResize\index.svelte generated by Svelte v3.50.1 */
    const get_default_slot_changes$1 = dirty => ({});

    const get_default_slot_context$1 = ctx => ({
    	movePointerDown: /*pointerdown*/ ctx[18],
    	resizePointerDown: /*resizePointerDown*/ ctx[19]
    });

    // (72:2) {#if resizable && !item.customResizer}
    function create_if_block_1$1(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "svlt-grid-resizer svelte-5a4fuj");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (!mounted) {
    				dispose = listen(div, "pointerdown", /*resizePointerDown*/ ctx[19]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (77:0) {#if active || trans}
    function create_if_block$4(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "svlt-grid-shadow shadow-active svelte-5a4fuj");
    			set_style(div, "width", /*shadow*/ ctx[12].w * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[8] * 2 + "px");
    			set_style(div, "height", /*shadow*/ ctx[12].h * /*yPerPx*/ ctx[7] - /*gapY*/ ctx[9] * 2 + "px");
    			set_style(div, "transform", "translate(" + (/*shadow*/ ctx[12].x * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[8]) + "px, " + (/*shadow*/ ctx[12].y * /*yPerPx*/ ctx[7] + /*gapY*/ ctx[9]) + "px)");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			/*div_binding*/ ctx[29](div);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*shadow, xPerPx, gapX*/ 4416) {
    				set_style(div, "width", /*shadow*/ ctx[12].w * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[8] * 2 + "px");
    			}

    			if (dirty[0] & /*shadow, yPerPx, gapY*/ 4736) {
    				set_style(div, "height", /*shadow*/ ctx[12].h * /*yPerPx*/ ctx[7] - /*gapY*/ ctx[9] * 2 + "px");
    			}

    			if (dirty[0] & /*shadow, xPerPx, gapX, yPerPx, gapY*/ 5056) {
    				set_style(div, "transform", "translate(" + (/*shadow*/ ctx[12].x * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[8]) + "px, " + (/*shadow*/ ctx[12].y * /*yPerPx*/ ctx[7] + /*gapY*/ ctx[9]) + "px)");
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			/*div_binding*/ ctx[29](null);
    		}
    	};
    }

    function create_fragment$f(ctx) {
    	let div;
    	let t0;
    	let div_style_value;
    	let t1;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[28].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[27], get_default_slot_context$1);
    	let if_block0 = /*resizable*/ ctx[4] && !/*item*/ ctx[10].customResizer && create_if_block_1$1(ctx);
    	let if_block1 = (/*active*/ ctx[13] || /*trans*/ ctx[16]) && create_if_block$4(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr(div, "draggable", false);
    			attr(div, "class", "svlt-grid-item svelte-5a4fuj");

    			attr(div, "style", div_style_value = "width: " + (/*active*/ ctx[13]
    			? /*newSize*/ ctx[15].width
    			: /*width*/ ctx[0]) + "px; height:" + (/*active*/ ctx[13]
    			? /*newSize*/ ctx[15].height
    			: /*height*/ ctx[1]) + "px; " + (/*active*/ ctx[13]
    			? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px);top:${/*rect*/ ctx[17].top}px;left:${/*rect*/ ctx[17].left}px;`
    			: /*trans*/ ctx[16]
    				? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px); position:absolute; transition: width 0.2s, height 0.2s;`
    				: `transition: transform 0.2s, opacity 0.2s; transform: translate(${/*left*/ ctx[2]}px, ${/*top*/ ctx[3]}px); `) + "");

    			toggle_class(div, "svlt-grid-active", /*active*/ ctx[13] || /*trans*/ ctx[16] && /*rect*/ ctx[17]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			insert(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div, "pointerdown", function () {
    					if (is_function(/*item*/ ctx[10] && /*item*/ ctx[10].customDragger
    					? null
    					: /*draggable*/ ctx[5] && /*pointerdown*/ ctx[18])) (/*item*/ ctx[10] && /*item*/ ctx[10].customDragger
    					? null
    					: /*draggable*/ ctx[5] && /*pointerdown*/ ctx[18]).apply(this, arguments);
    				});

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 134217728)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[27], dirty, get_default_slot_changes$1),
    						get_default_slot_context$1
    					);
    				}
    			}

    			if (/*resizable*/ ctx[4] && !/*item*/ ctx[10].customResizer) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty[0] & /*active, newSize, width, height, cordDiff, rect, trans, left, top*/ 253967 && div_style_value !== (div_style_value = "width: " + (/*active*/ ctx[13]
    			? /*newSize*/ ctx[15].width
    			: /*width*/ ctx[0]) + "px; height:" + (/*active*/ ctx[13]
    			? /*newSize*/ ctx[15].height
    			: /*height*/ ctx[1]) + "px; " + (/*active*/ ctx[13]
    			? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px);top:${/*rect*/ ctx[17].top}px;left:${/*rect*/ ctx[17].left}px;`
    			: /*trans*/ ctx[16]
    				? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px); position:absolute; transition: width 0.2s, height 0.2s;`
    				: `transition: transform 0.2s, opacity 0.2s; transform: translate(${/*left*/ ctx[2]}px, ${/*top*/ ctx[3]}px); `) + "")) {
    				attr(div, "style", div_style_value);
    			}

    			if (!current || dirty[0] & /*active, trans, rect*/ 204800) {
    				toggle_class(div, "svlt-grid-active", /*active*/ ctx[13] || /*trans*/ ctx[16] && /*rect*/ ctx[17]);
    			}

    			if (/*active*/ ctx[13] || /*trans*/ ctx[16]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block0) if_block0.d();
    			if (detaching) detach(t1);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	let { sensor } = $$props;
    	let { width } = $$props;
    	let { height } = $$props;
    	let { left } = $$props;
    	let { top } = $$props;
    	let { resizable } = $$props;
    	let { draggable } = $$props;
    	let { id } = $$props;
    	let { container } = $$props;
    	let { xPerPx } = $$props;
    	let { yPerPx } = $$props;
    	let { gapX } = $$props;
    	let { gapY } = $$props;
    	let { item } = $$props;
    	let { max } = $$props;
    	let { min } = $$props;
    	let { cols } = $$props;
    	let { nativeContainer } = $$props;
    	let shadowElement;
    	let shadow = {};
    	let active = false;
    	let initX, initY;
    	let capturePos = { x: 0, y: 0 };
    	let cordDiff = { x: 0, y: 0 };
    	let newSize = { width, height };
    	let trans = false;
    	let anima;

    	const inActivate = () => {
    		const shadowBound = shadowElement.getBoundingClientRect();
    		const xdragBound = rect.left + cordDiff.x;
    		const ydragBound = rect.top + cordDiff.y;
    		$$invalidate(14, cordDiff.x = shadow.x * xPerPx + gapX - (shadowBound.x - xdragBound), cordDiff);
    		$$invalidate(14, cordDiff.y = shadow.y * yPerPx + gapY - (shadowBound.y - ydragBound), cordDiff);
    		$$invalidate(13, active = false);
    		$$invalidate(16, trans = true);
    		clearTimeout(anima);

    		anima = setTimeout(
    			() => {
    				$$invalidate(16, trans = false);
    			},
    			100
    		);

    		dispatch("pointerup", { id });
    	};

    	let repaint = (cb, isPointerUp) => {
    		dispatch("repaint", { id, shadow, isPointerUp, onUpdate: cb });
    	};

    	// Autoscroll
    	let _scrollTop = 0;

    	let containerFrame;
    	let rect;
    	let scrollElement;

    	const getContainerFrame = element => {
    		if (element === document.documentElement || !element) {
    			const { height, top, right, bottom, left } = nativeContainer.getBoundingClientRect();

    			return {
    				top: Math.max(0, top),
    				bottom: Math.min(window.innerHeight, bottom)
    			};
    		}

    		return element.getBoundingClientRect();
    	};

    	const getScroller = element => !element ? document.documentElement : element;

    	const pointerdown = ({ clientX, clientY, target }) => {
    		initX = clientX;
    		initY = clientY;
    		capturePos = { x: left, y: top };

    		$$invalidate(12, shadow = {
    			x: item.x,
    			y: item.y,
    			w: item.w,
    			h: item.h
    		});

    		$$invalidate(15, newSize = { width, height });
    		containerFrame = getContainerFrame(container);
    		scrollElement = getScroller(container);
    		$$invalidate(14, cordDiff = { x: 0, y: 0 });
    		$$invalidate(17, rect = target.closest(".svlt-grid-item").getBoundingClientRect());
    		$$invalidate(13, active = true);
    		$$invalidate(16, trans = false);
    		_scrollTop = scrollElement.scrollTop;
    		window.addEventListener("pointermove", pointermove);
    		window.addEventListener("pointerup", pointerup);
    	};

    	let sign = { x: 0, y: 0 };
    	let vel = { x: 0, y: 0 };
    	let intervalId = 0;

    	const stopAutoscroll = () => {
    		clearInterval(intervalId);
    		intervalId = false;
    		sign = { x: 0, y: 0 };
    		vel = { x: 0, y: 0 };
    	};

    	const update = () => {
    		const _newScrollTop = scrollElement.scrollTop - _scrollTop;
    		const boundX = capturePos.x + cordDiff.x;
    		const boundY = capturePos.y + (cordDiff.y + _newScrollTop);
    		let gridX = Math.round(boundX / xPerPx);
    		let gridY = Math.round(boundY / yPerPx);
    		$$invalidate(12, shadow.x = Math.max(Math.min(gridX, cols - shadow.w), 0), shadow);
    		$$invalidate(12, shadow.y = Math.max(gridY, 0), shadow);

    		if (max.y) {
    			$$invalidate(12, shadow.y = Math.min(shadow.y, max.y), shadow);
    		}

    		repaint();
    	};

    	const pointermove = event => {
    		event.preventDefault();
    		event.stopPropagation();
    		event.stopImmediatePropagation();
    		const { clientX, clientY } = event;
    		$$invalidate(14, cordDiff = { x: clientX - initX, y: clientY - initY });
    		const Y_SENSOR = sensor;
    		let velocityTop = Math.max(0, (containerFrame.top + Y_SENSOR - clientY) / Y_SENSOR);
    		let velocityBottom = Math.max(0, (clientY - (containerFrame.bottom - Y_SENSOR)) / Y_SENSOR);
    		const topSensor = velocityTop > 0 && velocityBottom === 0;
    		const bottomSensor = velocityBottom > 0 && velocityTop === 0;
    		sign.y = topSensor ? -1 : bottomSensor ? 1 : 0;
    		vel.y = sign.y === -1 ? velocityTop : velocityBottom;

    		if (vel.y > 0) {
    			if (!intervalId) {
    				// Start scrolling
    				// TODO Use requestAnimationFrame
    				intervalId = setInterval(
    					() => {
    						scrollElement.scrollTop += 2 * (vel.y + Math.sign(vel.y)) * sign.y;
    						update();
    					},
    					10
    				);
    			}
    		} else if (intervalId) {
    			stopAutoscroll();
    		} else {
    			update();
    		}
    	};

    	const pointerup = e => {
    		stopAutoscroll();
    		window.removeEventListener("pointerdown", pointerdown);
    		window.removeEventListener("pointermove", pointermove);
    		window.removeEventListener("pointerup", pointerup);
    		repaint(inActivate, true);
    	};

    	// Resize
    	let resizeInitPos = { x: 0, y: 0 };

    	let initSize = { width: 0, height: 0 };

    	const resizePointerDown = e => {
    		e.stopPropagation();
    		const { pageX, pageY } = e;
    		resizeInitPos = { x: pageX, y: pageY };
    		initSize = { width, height };
    		$$invalidate(14, cordDiff = { x: 0, y: 0 });
    		$$invalidate(17, rect = e.target.closest(".svlt-grid-item").getBoundingClientRect());
    		$$invalidate(15, newSize = { width, height });
    		$$invalidate(13, active = true);
    		$$invalidate(16, trans = false);

    		$$invalidate(12, shadow = {
    			x: item.x,
    			y: item.y,
    			w: item.w,
    			h: item.h
    		});

    		containerFrame = getContainerFrame(container);
    		scrollElement = getScroller(container);
    		window.addEventListener("pointermove", resizePointerMove);
    		window.addEventListener("pointerup", resizePointerUp);
    	};

    	const resizePointerMove = ({ pageX, pageY }) => {
    		$$invalidate(15, newSize.width = initSize.width + pageX - resizeInitPos.x, newSize);
    		$$invalidate(15, newSize.height = initSize.height + pageY - resizeInitPos.y, newSize);

    		// Get max col number
    		let maxWidth = cols - shadow.x;

    		maxWidth = Math.min(max.w, maxWidth) || maxWidth;

    		// Limit bound
    		$$invalidate(15, newSize.width = Math.max(Math.min(newSize.width, maxWidth * xPerPx - gapX * 2), min.w * xPerPx - gapX * 2), newSize);

    		$$invalidate(15, newSize.height = Math.max(newSize.height, min.h * yPerPx - gapY * 2), newSize);

    		if (max.h) {
    			$$invalidate(15, newSize.height = Math.min(newSize.height, max.h * yPerPx - gapY * 2), newSize);
    		}

    		// Limit col & row
    		$$invalidate(12, shadow.w = Math.round((newSize.width + gapX * 2) / xPerPx), shadow);

    		$$invalidate(12, shadow.h = Math.round((newSize.height + gapY * 2) / yPerPx), shadow);
    		repaint();
    	};

    	const resizePointerUp = e => {
    		e.stopPropagation();
    		repaint(inActivate, true);
    		window.removeEventListener("pointermove", resizePointerMove);
    		window.removeEventListener("pointerup", resizePointerUp);
    	};

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			shadowElement = $$value;
    			$$invalidate(11, shadowElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('sensor' in $$props) $$invalidate(20, sensor = $$props.sensor);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('left' in $$props) $$invalidate(2, left = $$props.left);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('resizable' in $$props) $$invalidate(4, resizable = $$props.resizable);
    		if ('draggable' in $$props) $$invalidate(5, draggable = $$props.draggable);
    		if ('id' in $$props) $$invalidate(21, id = $$props.id);
    		if ('container' in $$props) $$invalidate(22, container = $$props.container);
    		if ('xPerPx' in $$props) $$invalidate(6, xPerPx = $$props.xPerPx);
    		if ('yPerPx' in $$props) $$invalidate(7, yPerPx = $$props.yPerPx);
    		if ('gapX' in $$props) $$invalidate(8, gapX = $$props.gapX);
    		if ('gapY' in $$props) $$invalidate(9, gapY = $$props.gapY);
    		if ('item' in $$props) $$invalidate(10, item = $$props.item);
    		if ('max' in $$props) $$invalidate(23, max = $$props.max);
    		if ('min' in $$props) $$invalidate(24, min = $$props.min);
    		if ('cols' in $$props) $$invalidate(25, cols = $$props.cols);
    		if ('nativeContainer' in $$props) $$invalidate(26, nativeContainer = $$props.nativeContainer);
    		if ('$$scope' in $$props) $$invalidate(27, $$scope = $$props.$$scope);
    	};

    	return [
    		width,
    		height,
    		left,
    		top,
    		resizable,
    		draggable,
    		xPerPx,
    		yPerPx,
    		gapX,
    		gapY,
    		item,
    		shadowElement,
    		shadow,
    		active,
    		cordDiff,
    		newSize,
    		trans,
    		rect,
    		pointerdown,
    		resizePointerDown,
    		sensor,
    		id,
    		container,
    		max,
    		min,
    		cols,
    		nativeContainer,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class MoveResize extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$e,
    			create_fragment$f,
    			safe_not_equal,
    			{
    				sensor: 20,
    				width: 0,
    				height: 1,
    				left: 2,
    				top: 3,
    				resizable: 4,
    				draggable: 5,
    				id: 21,
    				container: 22,
    				xPerPx: 6,
    				yPerPx: 7,
    				gapX: 8,
    				gapY: 9,
    				item: 10,
    				max: 23,
    				min: 24,
    				cols: 25,
    				nativeContainer: 26
    			},
    			null,
    			[-1, -1]
    		);
    	}
    }

    /* node_modules\.pnpm\svelte-grid@5.1.1\node_modules\svelte-grid\src\index.svelte generated by Svelte v3.50.1 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[30] = i;
    	return child_ctx;
    }

    const get_default_slot_changes = dirty => ({
    	movePointerDown: dirty[1] & /*movePointerDown*/ 2,
    	resizePointerDown: dirty[1] & /*resizePointerDown*/ 1,
    	dataItem: dirty[0] & /*items*/ 1,
    	item: dirty[0] & /*items, getComputedCols*/ 17,
    	index: dirty[0] & /*items*/ 1
    });

    const get_default_slot_context = ctx => ({
    	movePointerDown: /*movePointerDown*/ ctx[32],
    	resizePointerDown: /*resizePointerDown*/ ctx[31],
    	dataItem: /*item*/ ctx[28],
    	item: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]],
    	index: /*i*/ ctx[30]
    });

    // (8:2) {#if xPerPx || !fastStart}
    function create_if_block$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	const get_key = ctx => /*item*/ ctx[28].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*items, getComputedCols, xPerPx, yPerPx, gapX, gapY, sensor, scroller, container, handleRepaint, pointerup, $$scope*/ 2105213 | dirty[1] & /*movePointerDown, resizePointerDown*/ 3) {
    				each_value = /*items*/ ctx[0];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (33:8) {#if item[getComputedCols]}
    function create_if_block_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], get_default_slot_context);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope, items, getComputedCols*/ 2097169 | dirty[1] & /*movePointerDown, resizePointerDown*/ 3)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[21],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[21])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (10:6) <MoveResize         on:repaint={handleRepaint}         on:pointerup={pointerup}         id={item.id}         resizable={item[getComputedCols] && item[getComputedCols].resizable}         draggable={item[getComputedCols] && item[getComputedCols].draggable}         {xPerPx}         {yPerPx}         width={Math.min(getComputedCols, item[getComputedCols] && item[getComputedCols].w) * xPerPx - gapX * 2}         height={(item[getComputedCols] && item[getComputedCols].h) * yPerPx - gapY * 2}         top={(item[getComputedCols] && item[getComputedCols].y) * yPerPx + gapY}         left={(item[getComputedCols] && item[getComputedCols].x) * xPerPx + gapX}         item={item[getComputedCols]}         min={item[getComputedCols] && item[getComputedCols].min}         max={item[getComputedCols] && item[getComputedCols].max}         cols={getComputedCols}         {gapX}         {gapY}         {sensor}         container={scroller}         nativeContainer={container}         let:resizePointerDown         let:movePointerDown>
    function create_default_slot$5(ctx) {
    	let t;
    	let current;
    	let if_block = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && create_if_block_1(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			t = space();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*items, getComputedCols*/ 17) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t);
    		}
    	};
    }

    // (9:4) {#each items as item, i (item.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let moveresize;
    	let current;

    	moveresize = new MoveResize({
    			props: {
    				id: /*item*/ ctx[28].id,
    				resizable: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].resizable,
    				draggable: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].draggable,
    				xPerPx: /*xPerPx*/ ctx[6],
    				yPerPx: /*yPerPx*/ ctx[10],
    				width: Math.min(/*getComputedCols*/ ctx[4], /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].w) * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[9] * 2,
    				height: (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].h) * /*yPerPx*/ ctx[10] - /*gapY*/ ctx[8] * 2,
    				top: (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].y) * /*yPerPx*/ ctx[10] + /*gapY*/ ctx[8],
    				left: (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].x) * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[9],
    				item: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]],
    				min: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].min,
    				max: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].max,
    				cols: /*getComputedCols*/ ctx[4],
    				gapX: /*gapX*/ ctx[9],
    				gapY: /*gapY*/ ctx[8],
    				sensor: /*sensor*/ ctx[3],
    				container: /*scroller*/ ctx[2],
    				nativeContainer: /*container*/ ctx[5],
    				$$slots: {
    					default: [
    						create_default_slot$5,
    						({ resizePointerDown, movePointerDown }) => ({
    							31: resizePointerDown,
    							32: movePointerDown
    						}),
    						({ resizePointerDown, movePointerDown }) => [0, (resizePointerDown ? 1 : 0) | (movePointerDown ? 2 : 0)]
    					]
    				},
    				$$scope: { ctx }
    			}
    		});

    	moveresize.$on("repaint", /*handleRepaint*/ ctx[12]);
    	moveresize.$on("pointerup", /*pointerup*/ ctx[11]);

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(moveresize.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(moveresize, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const moveresize_changes = {};
    			if (dirty[0] & /*items*/ 1) moveresize_changes.id = /*item*/ ctx[28].id;
    			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.resizable = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].resizable;
    			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.draggable = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].draggable;
    			if (dirty[0] & /*xPerPx*/ 64) moveresize_changes.xPerPx = /*xPerPx*/ ctx[6];
    			if (dirty[0] & /*getComputedCols, items, xPerPx, gapX*/ 593) moveresize_changes.width = Math.min(/*getComputedCols*/ ctx[4], /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].w) * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[9] * 2;
    			if (dirty[0] & /*items, getComputedCols, gapY*/ 273) moveresize_changes.height = (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].h) * /*yPerPx*/ ctx[10] - /*gapY*/ ctx[8] * 2;
    			if (dirty[0] & /*items, getComputedCols, gapY*/ 273) moveresize_changes.top = (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].y) * /*yPerPx*/ ctx[10] + /*gapY*/ ctx[8];
    			if (dirty[0] & /*items, getComputedCols, xPerPx, gapX*/ 593) moveresize_changes.left = (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].x) * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[9];
    			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.item = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]];
    			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.min = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].min;
    			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.max = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].max;
    			if (dirty[0] & /*getComputedCols*/ 16) moveresize_changes.cols = /*getComputedCols*/ ctx[4];
    			if (dirty[0] & /*gapX*/ 512) moveresize_changes.gapX = /*gapX*/ ctx[9];
    			if (dirty[0] & /*gapY*/ 256) moveresize_changes.gapY = /*gapY*/ ctx[8];
    			if (dirty[0] & /*sensor*/ 8) moveresize_changes.sensor = /*sensor*/ ctx[3];
    			if (dirty[0] & /*scroller*/ 4) moveresize_changes.container = /*scroller*/ ctx[2];
    			if (dirty[0] & /*container*/ 32) moveresize_changes.nativeContainer = /*container*/ ctx[5];

    			if (dirty[0] & /*$$scope, items, getComputedCols*/ 2097169 | dirty[1] & /*movePointerDown, resizePointerDown*/ 3) {
    				moveresize_changes.$$scope = { dirty, ctx };
    			}

    			moveresize.$set(moveresize_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(moveresize.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(moveresize.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(moveresize, detaching);
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	let div;
    	let current;
    	let if_block = (/*xPerPx*/ ctx[6] || !/*fastStart*/ ctx[1]) && create_if_block$3(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr(div, "class", "svlt-grid-container svelte-1ahv2yu");
    			set_style(div, "height", /*containerHeight*/ ctx[7] + "px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			/*div_binding*/ ctx[20](div);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*xPerPx*/ ctx[6] || !/*fastStart*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*xPerPx, fastStart*/ 66) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*containerHeight*/ 128) {
    				set_style(div, "height", /*containerHeight*/ ctx[7] + "px");
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    			/*div_binding*/ ctx[20](null);
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let gapX;
    	let gapY;
    	let containerHeight;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	let { fillSpace = false } = $$props;
    	let { items } = $$props;
    	let { rowHeight } = $$props;
    	let { cols } = $$props;
    	let { gap = [10, 10] } = $$props;
    	let { fastStart = false } = $$props;
    	let { throttleUpdate = 100 } = $$props;
    	let { throttleResize = 100 } = $$props;
    	let { scroller = undefined } = $$props;
    	let { sensor = 20 } = $$props;
    	let getComputedCols;
    	let container;
    	let xPerPx = 0;
    	let yPerPx = rowHeight;
    	let containerWidth;

    	const pointerup = ev => {
    		dispatch("pointerup", { id: ev.detail.id, cols: getComputedCols });
    	};

    	const onResize = throttle(
    		() => {
    			$$invalidate(0, items = specifyUndefinedColumns(items, getComputedCols, cols));

    			dispatch("resize", {
    				cols: getComputedCols,
    				xPerPx,
    				yPerPx,
    				width: containerWidth
    			});
    		},
    		throttleUpdate
    	);

    	onMount(() => {
    		const sizeObserver = new ResizeObserver(entries => {
    				requestAnimationFrame(() => {
    					let width = entries[0].contentRect.width;
    					if (width === containerWidth) return;
    					$$invalidate(4, getComputedCols = getColumn(width, cols));
    					$$invalidate(6, xPerPx = width / getComputedCols);

    					if (!containerWidth) {
    						$$invalidate(0, items = specifyUndefinedColumns(items, getComputedCols, cols));
    						dispatch("mount", { cols: getComputedCols, xPerPx, yPerPx });
    					} else {
    						onResize();
    					}

    					containerWidth = width;
    				});
    			});

    		sizeObserver.observe(container);
    		return () => sizeObserver.disconnect();
    	});

    	const updateMatrix = ({ detail }) => {
    		let activeItem = getItemById(detail.id, items);

    		if (activeItem) {
    			activeItem = {
    				...activeItem,
    				[getComputedCols]: {
    					...activeItem[getComputedCols],
    					...detail.shadow
    				}
    			};

    			if (fillSpace) {
    				$$invalidate(0, items = moveItemsAroundItem(activeItem, items, getComputedCols, getItemById(detail.id, items)));
    			} else {
    				$$invalidate(0, items = moveItem(activeItem, items, getComputedCols, getItemById(detail.id, items)));
    			}

    			if (detail.onUpdate) detail.onUpdate();

    			dispatch("change", {
    				unsafeItem: activeItem,
    				id: activeItem.id,
    				cols: getComputedCols
    			});
    		}
    	};

    	const throttleMatrix = throttle(updateMatrix, throttleResize);

    	const handleRepaint = ({ detail }) => {
    		if (!detail.isPointerUp) {
    			throttleMatrix({ detail });
    		} else {
    			updateMatrix({ detail });
    		}
    	};

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(5, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('fillSpace' in $$props) $$invalidate(13, fillSpace = $$props.fillSpace);
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('rowHeight' in $$props) $$invalidate(14, rowHeight = $$props.rowHeight);
    		if ('cols' in $$props) $$invalidate(15, cols = $$props.cols);
    		if ('gap' in $$props) $$invalidate(16, gap = $$props.gap);
    		if ('fastStart' in $$props) $$invalidate(1, fastStart = $$props.fastStart);
    		if ('throttleUpdate' in $$props) $$invalidate(17, throttleUpdate = $$props.throttleUpdate);
    		if ('throttleResize' in $$props) $$invalidate(18, throttleResize = $$props.throttleResize);
    		if ('scroller' in $$props) $$invalidate(2, scroller = $$props.scroller);
    		if ('sensor' in $$props) $$invalidate(3, sensor = $$props.sensor);
    		if ('$$scope' in $$props) $$invalidate(21, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*gap*/ 65536) {
    			$$invalidate(9, [gapX, gapY] = gap, gapX, ($$invalidate(8, gapY), $$invalidate(16, gap)));
    		}

    		if ($$self.$$.dirty[0] & /*items, getComputedCols*/ 17) {
    			$$invalidate(7, containerHeight = getContainerHeight(items, yPerPx, getComputedCols));
    		}
    	};

    	return [
    		items,
    		fastStart,
    		scroller,
    		sensor,
    		getComputedCols,
    		container,
    		xPerPx,
    		containerHeight,
    		gapY,
    		gapX,
    		yPerPx,
    		pointerup,
    		handleRepaint,
    		fillSpace,
    		rowHeight,
    		cols,
    		gap,
    		throttleUpdate,
    		throttleResize,
    		slots,
    		div_binding,
    		$$scope
    	];
    }

    class Src$1 extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$d,
    			create_fragment$e,
    			safe_not_equal,
    			{
    				fillSpace: 13,
    				items: 0,
    				rowHeight: 14,
    				cols: 15,
    				gap: 16,
    				fastStart: 1,
    				throttleUpdate: 17,
    				throttleResize: 18,
    				scroller: 2,
    				sensor: 3
    			},
    			null,
    			[-1, -1]
    		);
    	}
    }

    function makeItem(item) {
      const { min = { w: 1, h: 1 }, max } = item;
      return {
        fixed: false,
        resizable: !item.fixed,
        draggable: !item.fixed,
        customDragger: false,
        customResizer: false,
        min: {
          w: Math.max(1, min.w),
          h: Math.max(1, min.h),
        },
        max: { ...max },
        ...item,
      };
    }

    const gridHelp = {
      normalize(items, col) {
        getRowsCount(items, col);
        return normalize(items, col);
      },

      adjust(items, col) {
        return adjust(items, col);
      },

      item(obj) {
        return makeItem(obj);
      },

      findSpace(item, items, cols) {
        let matrix = makeMatrixFromItems(items, getRowsCount(items, cols), cols);

        let position = findFreeSpaceForItem(matrix, item[cols]);
        return position;
      },
    };

    /* src\v0.3.0\components\ytgif\components\Player.svelte generated by Svelte v3.50.1 */

    function create_fragment$d(ctx) {
    	let div4;
    	let div3;
    	let div1;
    	let t;
    	let div2;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div1.innerHTML = `<div id="yt-gif-empty-player"></div>`;
    			t = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			attr(div1, "class", "iframe-wrapper svelte-1cd5eb0");
    			attr(div2, "class", "controls svelte-1cd5eb0");
    			attr(div3, "class", "wrapper dont-focus-block svelte-1cd5eb0");
    			attr(div3, "data-anim", "pulse input thumbnail");
    			attr(div4, "class", "outter svelte-1cd5eb0");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div1);
    			append(div3, t);
    			append(div3, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div4);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Player extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, {});
    	}
    }

    const top_icon = 'bp3-button bp3-minimal';

    function toClassName(value) {
      let result = '';

      if (typeof value === 'string' || typeof value === 'number') {
        result += value;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = value.map(toClassName).filter(Boolean).join(' ');
        } else {
          for (let key in value) {
            if (value[key]) {
              result && (result += ' ');
              result += key;
            }
          }
        }
      }

      return result;
    }

    function classnames(...args) {
      return args.map(toClassName).filter(Boolean).join(' ');
    }

    /* node_modules\.pnpm\sveltestrap@5.9.0_svelte@3.50.1\node_modules\sveltestrap\src\Icon.svelte generated by Svelte v3.50.1 */

    function create_fragment$c(ctx) {
    	let i;
    	let i_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let i_data = {};

    	for (let i = 0; i < i_levels.length; i += 1) {
    		i_data = assign(i_data, i_levels[i]);
    	}

    	return {
    		c() {
    			i = element("i");
    			set_attributes(i, i_data);
    		},
    		m(target, anchor) {
    			insert(target, i, anchor);
    		},
    		p(ctx, [dirty]) {
    			set_attributes(i, i_data = get_spread_update(i_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				dirty & /*classes*/ 1 && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(i);
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","name"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { class: className = '' } = $$props;
    	let { name = '' } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ('name' in $$new_props) $$invalidate(3, name = $$new_props.name);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, name*/ 12) {
    			$$invalidate(0, classes = classnames(className, `bi-${name}`));
    		}
    	};

    	return [classes, $$restProps, className, name];
    }

    class Icon extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, { class: 2, name: 3 });
    	}
    }

    /* src\v0.3.0\components\Icon.svelte generated by Svelte v3.50.1 */

    function create_fragment$b(ctx) {
    	let span;
    	let icon;
    	let span_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	icon = new Icon({ props: { name: /*name*/ ctx[5] } });

    	let span_levels = [
    		{ "data-tooltip": /*tooltip*/ ctx[0] },
    		{
    			"data-tooltip-conf": /*placement*/ ctx[2]
    		},
    		/*data*/ ctx[1],
    		{
    			class: span_class_value = "hover-bg " + top_icon + " text-color-400"
    		}
    	];

    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	return {
    		c() {
    			span = element("span");
    			create_component(icon.$$.fragment);
    			set_attributes(span, span_data);
    			toggle_class(span, "svelte-1a4lm29", true);
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			mount_component(icon, span, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(span, "mouseup", /*mouseup_handler*/ ctx[19]),
    					listen(span, "click", /*click_handler*/ ctx[20])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			const icon_changes = {};
    			if (dirty & /*name*/ 32) icon_changes.name = /*name*/ ctx[5];
    			icon.$set(icon_changes);

    			set_attributes(span, span_data = get_spread_update(span_levels, [
    				(!current || dirty & /*tooltip*/ 1) && { "data-tooltip": /*tooltip*/ ctx[0] },
    				(!current || dirty & /*placement*/ 4) && {
    					"data-tooltip-conf": /*placement*/ ctx[2]
    				},
    				dirty & /*data*/ 2 && /*data*/ ctx[1],
    				{ class: span_class_value }
    			]));

    			toggle_class(span, "svelte-1a4lm29", true);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    			destroy_component(icon);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let enabled;
    	const dispatch = createEventDispatcher();
    	let { checked = false } = $$props;

    	let { click = enabled => {
    		$$invalidate(11, checked = enabled);
    	} } = $$props;

    	let { self = false } = $$props;
    	let { on = '' } = $$props;
    	let { off = self ? 'dot' : on + '-fill' } = $$props;
    	let name = on;
    	let { selected = false } = $$props;
    	let { tooltip = '...' } = $$props;
    	let { data = {} } = $$props;
    	let { placement = 'top' } = $$props;

    	const setOpenClose = open => {
    		if (open) {
    			click(enabled);
    		}

    		flip(open);
    		dispatch('flip', enabled);
    	};

    	const flip = b => $$invalidate(5, name = !b ? on : off);
    	let { show = undefined } = $$props;
    	onMount(() => flip(selected));
    	let { type = 'toggle' } = $$props;
    	let tout;
    	let lastTout;
    	let { propagation = false } = $$props;
    	const evt = e => propagation ? e.stopPropagation() : '';

    	const mouseup_handler = e => {
    		evt(e);

    		if (type == 'check') {
    			setOpenClose(!enabled);
    		} else if (lastTout == tout && type == 'toggle') {
    			setOpenClose(false);
    		}
    	};

    	const click_handler = e => {
    		evt(e);

    		if (type == 'check') {
    			setOpenClose(enabled);
    		} else if (type == 'toggle') {
    			setOpenClose(true);
    			clearTimeout($$invalidate(7, lastTout = tout));
    			$$invalidate(6, tout = setTimeout(() => flip(false), 200));
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('checked' in $$props) $$invalidate(11, checked = $$props.checked);
    		if ('click' in $$props) $$invalidate(12, click = $$props.click);
    		if ('self' in $$props) $$invalidate(13, self = $$props.self);
    		if ('on' in $$props) $$invalidate(14, on = $$props.on);
    		if ('off' in $$props) $$invalidate(15, off = $$props.off);
    		if ('selected' in $$props) $$invalidate(16, selected = $$props.selected);
    		if ('tooltip' in $$props) $$invalidate(0, tooltip = $$props.tooltip);
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('placement' in $$props) $$invalidate(2, placement = $$props.placement);
    		if ('show' in $$props) $$invalidate(17, show = $$props.show);
    		if ('type' in $$props) $$invalidate(4, type = $$props.type);
    		if ('propagation' in $$props) $$invalidate(18, propagation = $$props.propagation);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*name, on*/ 16416) {
    			$$invalidate(8, enabled = name == on);
    		}

    		if ($$self.$$.dirty & /*show*/ 131072) {
    			if (show != undefined) {
    				flip(show);
    			}
    		}
    	};

    	return [
    		tooltip,
    		data,
    		placement,
    		setOpenClose,
    		type,
    		name,
    		tout,
    		lastTout,
    		enabled,
    		flip,
    		evt,
    		checked,
    		click,
    		self,
    		on,
    		off,
    		selected,
    		show,
    		propagation,
    		mouseup_handler,
    		click_handler
    	];
    }

    class Icon_1 extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$a, create_fragment$b, safe_not_equal, {
    			checked: 11,
    			click: 12,
    			self: 13,
    			on: 14,
    			off: 15,
    			selected: 16,
    			tooltip: 0,
    			data: 1,
    			placement: 2,
    			setOpenClose: 3,
    			show: 17,
    			type: 4,
    			propagation: 18
    		});
    	}

    	get setOpenClose() {
    		return this.$$.ctx[3];
    	}
    }

    /* node_modules\.pnpm\svelte-popover@2.0.8\node_modules\svelte-popover\src\Overlay.svelte generated by Svelte v3.50.1 */

    function create_fragment$a(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "id", "overlay");
    			attr(div, "class", "overlay svelte-fbiy2a");
    			set_style(div, "z-index", /*zIndex*/ ctx[0]);
    			set_style(div, "background-color", /*overlayColor*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(div, "mouseenter", /*onMouseEnter*/ ctx[4]),
    					listen(div, "click", /*onClick*/ ctx[2]),
    					listen(div, "touchend", /*onTouchEnd*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*zIndex*/ 1) {
    				set_style(div, "z-index", /*zIndex*/ ctx[0]);
    			}

    			if (dirty & /*overlayColor*/ 2) {
    				set_style(div, "background-color", /*overlayColor*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { zIndex } = $$props;
    	let { action } = $$props;
    	let { overlayColor = 'rgba(0,0,0,0.5)' } = $$props;
    	let { preventDefault } = $$props;
    	let { stopPropagation } = $$props;
    	const dispatch = createEventDispatcher();

    	const eventClick = e => {
    		if (preventDefault) e.preventDefault();
    		if (stopPropagation) e.stopPropagation();
    		dispatch('setOpen', {});
    	};

    	const onClick = action === 'click' ? eventClick : null;
    	const onTouchEnd = action === 'click' ? eventClick : null;
    	const onMouseEnter = action === 'hover' ? eventClick : null;

    	$$self.$$set = $$props => {
    		if ('zIndex' in $$props) $$invalidate(0, zIndex = $$props.zIndex);
    		if ('action' in $$props) $$invalidate(5, action = $$props.action);
    		if ('overlayColor' in $$props) $$invalidate(1, overlayColor = $$props.overlayColor);
    		if ('preventDefault' in $$props) $$invalidate(6, preventDefault = $$props.preventDefault);
    		if ('stopPropagation' in $$props) $$invalidate(7, stopPropagation = $$props.stopPropagation);
    	};

    	return [
    		zIndex,
    		overlayColor,
    		onClick,
    		onTouchEnd,
    		onMouseEnter,
    		action,
    		preventDefault,
    		stopPropagation
    	];
    }

    class Overlay extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$9, create_fragment$a, safe_not_equal, {
    			zIndex: 0,
    			action: 5,
    			overlayColor: 1,
    			preventDefault: 6,
    			stopPropagation: 7
    		});
    	}
    }

    /* node_modules\.pnpm\svelte-popover@2.0.8\node_modules\svelte-popover\src\Content.svelte generated by Svelte v3.50.1 */

    function create_if_block$2(ctx) {
    	let div;
    	let t;
    	let div_style_value;

    	return {
    		c() {
    			div = element("div");
    			t = text("◥");
    			attr(div, "class", "arrow svelte-1xwx9in");
    			attr(div, "style", div_style_value = "position: absolute; color: " + /*arrowColor*/ ctx[0] + "; " + /*arrowStyleProps*/ ctx[10]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    			/*div_binding*/ ctx[16](div);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*arrowColor, arrowStyleProps*/ 1025 && div_style_value !== (div_style_value = "position: absolute; color: " + /*arrowColor*/ ctx[0] + "; " + /*arrowStyleProps*/ ctx[10])) {
    				attr(div, "style", div_style_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			/*div_binding*/ ctx[16](null);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let div;
    	let t0;
    	let div_style_value;
    	let t1;
    	let overlay;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);
    	let if_block = /*arrow*/ ctx[2] && create_if_block$2(ctx);

    	overlay = new Overlay({
    			props: {
    				zIndex: /*zIndex*/ ctx[1],
    				overlayColor: /*overlayColor*/ ctx[6],
    				action: /*action*/ ctx[3],
    				stopPropagation: /*stopPropagation*/ ctx[5],
    				preventDefault: /*preventDefault*/ ctx[4]
    			}
    		});

    	overlay.$on("setOpen", /*setOpen*/ ctx[11]);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(overlay.$$.fragment);
    			attr(div, "class", "content svelte-1xwx9in");
    			attr(div, "style", div_style_value = "z-index: " + (/*zIndex*/ ctx[1] + 10) + "; " + /*positionStyle*/ ctx[9]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append(div, t0);
    			if (if_block) if_block.m(div, null);
    			/*div_binding_1*/ ctx[17](div);
    			insert(target, t1, anchor);
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[14],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null),
    						null
    					);
    				}
    			}

    			if (/*arrow*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*zIndex, positionStyle*/ 514 && div_style_value !== (div_style_value = "z-index: " + (/*zIndex*/ ctx[1] + 10) + "; " + /*positionStyle*/ ctx[9])) {
    				attr(div, "style", div_style_value);
    			}

    			const overlay_changes = {};
    			if (dirty & /*zIndex*/ 2) overlay_changes.zIndex = /*zIndex*/ ctx[1];
    			if (dirty & /*overlayColor*/ 64) overlay_changes.overlayColor = /*overlayColor*/ ctx[6];
    			if (dirty & /*action*/ 8) overlay_changes.action = /*action*/ ctx[3];
    			if (dirty & /*stopPropagation*/ 32) overlay_changes.stopPropagation = /*stopPropagation*/ ctx[5];
    			if (dirty & /*preventDefault*/ 16) overlay_changes.preventDefault = /*preventDefault*/ ctx[4];
    			overlay.$set(overlay_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    			/*div_binding_1*/ ctx[17](null);
    			if (detaching) detach(t1);
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { arrowColor } = $$props;
    	let { targetRef } = $$props;
    	let { zIndex } = $$props;
    	let { arrow } = $$props;
    	let { placement } = $$props;
    	let { action } = $$props;
    	let { preventDefault } = $$props;
    	let { stopPropagation } = $$props;
    	let { overlayColor } = $$props;
    	let contentRef;
    	let arrowRef;
    	let positionStyle = ``;
    	let arrowStyleProps = ``;
    	const dispatch = createEventDispatcher();

    	const setOpen = () => {
    		dispatch('setOpen', {});
    	};

    	const calculate = () => {
    		const targetBound = targetRef.getBoundingClientRect();
    		const contentBound = contentRef.getBoundingClientRect();
    		let arrowBound = { width: 0, height: 0 };

    		if (arrow) {
    			arrowBound = arrowRef.getBoundingClientRect();
    		}

    		const { innerWidth, innerHeight } = window;
    		const calcCoverLeft = contentBound.x - contentBound.width;
    		const coverLeft = calcCoverLeft < 0 ? calcCoverLeft : 0;
    		const calcCoverRight = contentBound.x + targetBound.width + contentBound.width;

    		const coverRight = calcCoverRight > innerWidth
    		? innerWidth - calcCoverRight
    		: 0;

    		const calcCoverTop = contentBound.y - contentBound.height;
    		const coverTop = calcCoverTop < 0 ? calcCoverTop : 0;
    		const calcCoverBottom = targetBound.bottom + contentBound.height;

    		const coverBottom = calcCoverBottom > innerHeight
    		? innerHeight - calcCoverBottom
    		: 0;

    		const calcXCenterLeft = contentBound.x + targetBound.width / 2 - contentBound.width / 2;
    		const calcXCenterRight = contentBound.x + targetBound.width / 2 - contentBound.width / 2 + contentBound.width;
    		const coverXCenterLeft = calcXCenterLeft < 0 ? calcXCenterLeft : 0;

    		const coverXCenterRight = calcXCenterRight > innerWidth
    		? innerWidth - calcXCenterRight
    		: 0;

    		const calcYCenterTop = contentBound.y + targetBound.height / 2 - contentBound.height / 2;
    		const coverYCenterTop = calcYCenterTop < 0 ? calcYCenterTop : 0;
    		const calcYCenterBottom = contentBound.y + targetBound.height / 2 - contentBound.height / 2 + contentBound.height;
    		const coverYCenterBottom = calcYCenterBottom > innerHeight ? calcYCenterBottom : 0;
    		const calcTopStart = contentBound.x + contentBound.width;

    		const coverTopStart = calcTopStart > innerWidth
    		? innerWidth - calcTopStart
    		: 0;

    		const calcTopEnd = contentBound.x - (contentBound.width - targetBound.width);
    		const coverTopEnd = calcTopEnd < 0 ? calcTopEnd : 0;
    		const calcLeftEndTop = contentBound.y - (contentBound.height - targetBound.height);
    		const coverLeftEndTop = calcLeftEndTop < 0 ? calcLeftEndTop : 0;
    		const coverRightEndTop = coverLeftEndTop;
    		const calcLefStartBottom = contentBound.y + contentBound.height;

    		const coverLeftStartBottom = calcLefStartBottom > innerHeight
    		? innerHeight - calcLefStartBottom
    		: 0;

    		const coverRightStartBottom = coverLeftStartBottom;
    		const coverBottomStartRight = coverTopStart;
    		const coverBottomEndLeft = coverTopEnd;
    		const xCenterStyle = targetBound.height / 2 - contentBound.height / 2;
    		const rightLeftEnd = -(contentBound.height - targetBound.height);
    		const topBottomEnd = -(contentBound.width - targetBound.width);
    		const topBottomCenter = targetBound.width / 2 - contentBound.width / 2;
    		const computeArrowW = arrowBound.width / 2;
    		const computearrowH = arrowBound.height / 2;
    		const leftLeftStyle = -(contentBound.width + computeArrowW);
    		const topTopStyle = -(contentBound.height + arrowBound.height / 2);
    		const rightLeftStyle = targetBound.width + computeArrowW;
    		const bottomTopStyle = targetBound.height + computearrowH;

    		const styles = {
    			topStart: `top:${topTopStyle}px`,
    			topCenter: `top:${topTopStyle}px;left:${topBottomCenter}px`,
    			topEnd: `top:${topTopStyle}px;left:${topBottomEnd}px`,
    			leftStart: `left:${leftLeftStyle}px`,
    			leftCenter: `left:${leftLeftStyle}px;top:${xCenterStyle}px`,
    			leftEnd: `left:${leftLeftStyle}px;top:${rightLeftEnd}px`,
    			rightStart: `left:${rightLeftStyle}px`,
    			rightCenter: `left:${rightLeftStyle}px;top:${xCenterStyle}px`,
    			rightEnd: `left:${rightLeftStyle}px;top:${rightLeftEnd}px`,
    			bottomStart: `top:${bottomTopStyle}px`,
    			bottomCenter: `top:${bottomTopStyle}px;left:${topBottomCenter}px`,
    			bottomEnd: `top:${bottomTopStyle}px;left:${topBottomEnd}px;`
    		};

    		const arrowBottomTransform = `transform:rotate(-45deg)`;
    		const arrowTopTransform = `transform: rotate(135deg)`;
    		const arrowLeftTransform = `transform: rotate(45deg)`;
    		const arrowRightTransform = `transform:rotate(45deg)`;
    		const arrowBottomTop = Math.ceil(-arrowBound.height / 2);
    		const arrowBottomTopCenter = contentBound.width / 2 - arrowBound.width / 2;
    		const arrowTop = contentBound.height - arrowBound.height / 2;
    		const arrowTopBottomEnd = targetBound.width / 2 - arrowBound.width / 2;
    		const arrowLeftRightEnd = contentBound.height - arrowBound.height / 2 - targetBound.height / 2;
    		const arrowLeftRightCenter = contentBound.height / 2 - Math.ceil(arrowBound.height / 2);
    		const arrowTopBottomStartLeft = targetBound.width / 2 - arrowBound.width / 2;
    		const arrowLeftLeft = Math.ceil(contentBound.width - arrowBound.width / 2);
    		const arrowLeftRightTop = targetBound.height / 2 - arrowBound.height / 2;

    		const arrowStyle = {
    			topStart: `${arrowTopTransform};top:${arrowTop}px;left:${arrowTopBottomStartLeft}px`,
    			topCenter: `${arrowTopTransform};top:${arrowTop}px;left:${arrowBottomTopCenter}px`,
    			topEnd: `${arrowTopTransform};top:${arrowTop}px;right:${arrowTopBottomEnd}px`,
    			leftStart: `${arrowLeftTransform};left:${arrowLeftLeft}px;top:${arrowLeftRightTop}px`,
    			leftCenter: `${arrowLeftTransform};left:${arrowLeftLeft}px;top:${arrowLeftRightCenter}px`,
    			leftEnd: `${arrowLeftTransform};left:${arrowLeftLeft}px;top:${arrowLeftRightEnd}px`,
    			rightStart: `${arrowRightTransform};left:${-arrowBound.width}px;top:${arrowLeftRightTop}px`,
    			rightCenter: `${arrowRightTransform};left:${-arrowBound.width}px;top:${arrowLeftRightCenter}px`,
    			rightEnd: `${arrowRightTransform};left:${-arrowBound.width}px;top:${arrowLeftRightEnd}px`,
    			bottomStart: `${arrowBottomTransform};top:${arrowBottomTop}px;left:${arrowTopBottomStartLeft}px`,
    			bottomCenter: `${arrowBottomTransform};top:${arrowBottomTop}px;left:${arrowBottomTopCenter}px`,
    			bottomEnd: `${arrowBottomTransform};top:${arrowBottomTop}px;right:${arrowTopBottomEnd}px`
    		};

    		const pos = [
    			{
    				at: 'top-start',
    				cover: [coverTop, coverTopStart, 0],
    				style: styles.topStart,
    				arrow: arrowStyle.topStart
    			},
    			{
    				at: 'top-center',
    				cover: [coverTop, coverXCenterLeft, coverXCenterRight],
    				style: styles.topCenter,
    				arrow: arrowStyle.topCenter
    			},
    			{
    				at: 'top-end',
    				cover: [coverTop, coverTopEnd, 0],
    				style: styles.topEnd,
    				arrow: arrowStyle.topEnd
    			},
    			{
    				at: 'left-start',
    				cover: [coverLeft, coverLeftStartBottom, 0],
    				style: styles.leftStart,
    				arrow: arrowStyle.leftStart
    			},
    			{
    				at: 'left-center',
    				cover: [coverLeft, coverYCenterTop, coverYCenterBottom],
    				style: styles.leftCenter,
    				arrow: arrowStyle.leftCenter
    			},
    			{
    				at: 'left-end',
    				cover: [coverLeft, coverLeftEndTop, 0],
    				style: styles.leftEnd,
    				arrow: arrowStyle.leftEnd
    			},
    			{
    				at: 'right-start',
    				cover: [coverRight, coverRightStartBottom, 0],
    				style: styles.rightStart,
    				arrow: arrowStyle.rightStart
    			},
    			{
    				at: 'right-center',
    				cover: [coverRight, coverYCenterTop, coverYCenterBottom],
    				style: styles.rightCenter,
    				arrow: arrowStyle.rightCenter
    			},
    			{
    				at: 'right-end',
    				cover: [coverRight, coverRightEndTop, 0],
    				style: styles.rightEnd,
    				arrow: arrowStyle.rightEnd
    			},
    			{
    				at: 'bottom-start',
    				cover: [coverBottom, coverBottomStartRight, 0],
    				style: styles.bottomStart,
    				arrow: arrowStyle.bottomStart
    			},
    			{
    				at: 'bottom-center',
    				cover: [coverBottom, coverXCenterLeft, coverXCenterRight],
    				style: styles.bottomCenter,
    				arrow: arrowStyle.bottomCenter
    			},
    			{
    				at: 'bottom-end',
    				cover: [coverBottom, coverBottomEndLeft, 0],
    				style: styles.bottomEnd,
    				arrow: arrowStyle.bottomEnd
    			}
    		];

    		let get;

    		if (placement === 'auto') {
    			const reducer = (accumulator, currentValue) => accumulator + currentValue;
    			const compute = pos.map(({ cover }) => cover.reduce(reducer));
    			const findIndex = compute.indexOf(Math.max(...compute));
    			const result = pos[findIndex];
    			get = result;
    		} else {
    			get = pos.filter(val => val.at === placement)[0];
    		}

    		pos.map(val => val.cover);
    		$$invalidate(9, positionStyle = get.style);
    		$$invalidate(10, arrowStyleProps = get.arrow);
    	};

    	onMount(() => {
    		calculate();
    		dispatch('open');
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			arrowRef = $$value;
    			$$invalidate(8, arrowRef);
    		});
    	}

    	function div_binding_1($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			contentRef = $$value;
    			$$invalidate(7, contentRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('arrowColor' in $$props) $$invalidate(0, arrowColor = $$props.arrowColor);
    		if ('targetRef' in $$props) $$invalidate(12, targetRef = $$props.targetRef);
    		if ('zIndex' in $$props) $$invalidate(1, zIndex = $$props.zIndex);
    		if ('arrow' in $$props) $$invalidate(2, arrow = $$props.arrow);
    		if ('placement' in $$props) $$invalidate(13, placement = $$props.placement);
    		if ('action' in $$props) $$invalidate(3, action = $$props.action);
    		if ('preventDefault' in $$props) $$invalidate(4, preventDefault = $$props.preventDefault);
    		if ('stopPropagation' in $$props) $$invalidate(5, stopPropagation = $$props.stopPropagation);
    		if ('overlayColor' in $$props) $$invalidate(6, overlayColor = $$props.overlayColor);
    		if ('$$scope' in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	return [
    		arrowColor,
    		zIndex,
    		arrow,
    		action,
    		preventDefault,
    		stopPropagation,
    		overlayColor,
    		contentRef,
    		arrowRef,
    		positionStyle,
    		arrowStyleProps,
    		setOpen,
    		targetRef,
    		placement,
    		$$scope,
    		slots,
    		div_binding,
    		div_binding_1
    	];
    }

    class Content extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$8, create_fragment$9, safe_not_equal, {
    			arrowColor: 0,
    			targetRef: 12,
    			zIndex: 1,
    			arrow: 2,
    			placement: 13,
    			action: 3,
    			preventDefault: 4,
    			stopPropagation: 5,
    			overlayColor: 6
    		});
    	}
    }

    /* node_modules\.pnpm\svelte-popover@2.0.8\node_modules\svelte-popover\src\index.svelte generated by Svelte v3.50.1 */
    const get_content_slot_changes = dirty => ({ open: dirty & /*open*/ 1 });
    const get_content_slot_context = ctx => ({ open: /*open*/ ctx[0] });
    const get_target_slot_changes = dirty => ({ open: dirty & /*open*/ 1 });
    const get_target_slot_context = ctx => ({ open: /*open*/ ctx[0] });

    // (14:2) {#if open}
    function create_if_block$1(ctx) {
    	let content;
    	let current;

    	content = new Content({
    			props: {
    				placement: /*placement*/ ctx[4],
    				targetRef: /*targetRef*/ ctx[9],
    				zIndex: /*zIndex*/ ctx[2],
    				arrow: /*arrow*/ ctx[3],
    				action: /*action*/ ctx[1],
    				overlayColor: /*overlayColor*/ ctx[6],
    				arrowColor: /*arrowColor*/ ctx[5],
    				preventDefault: /*preventDefault*/ ctx[7],
    				stopPropagation: /*stopPropagation*/ ctx[8],
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			}
    		});

    	content.$on("open", /*onOpen*/ ctx[10]);
    	content.$on("setOpen", /*setOpen*/ ctx[11]);

    	return {
    		c() {
    			create_component(content.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const content_changes = {};
    			if (dirty & /*placement*/ 16) content_changes.placement = /*placement*/ ctx[4];
    			if (dirty & /*targetRef*/ 512) content_changes.targetRef = /*targetRef*/ ctx[9];
    			if (dirty & /*zIndex*/ 4) content_changes.zIndex = /*zIndex*/ ctx[2];
    			if (dirty & /*arrow*/ 8) content_changes.arrow = /*arrow*/ ctx[3];
    			if (dirty & /*action*/ 2) content_changes.action = /*action*/ ctx[1];
    			if (dirty & /*overlayColor*/ 64) content_changes.overlayColor = /*overlayColor*/ ctx[6];
    			if (dirty & /*arrowColor*/ 32) content_changes.arrowColor = /*arrowColor*/ ctx[5];
    			if (dirty & /*preventDefault*/ 128) content_changes.preventDefault = /*preventDefault*/ ctx[7];
    			if (dirty & /*stopPropagation*/ 256) content_changes.stopPropagation = /*stopPropagation*/ ctx[8];

    			if (dirty & /*$$scope, open*/ 262145) {
    				content_changes.$$scope = { dirty, ctx };
    			}

    			content.$set(content_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(content, detaching);
    		}
    	};
    }

    // (15:4) <Content on:open={onOpen} on:setOpen={setOpen} {placement} {targetRef} {zIndex} {arrow} {action} {overlayColor} {arrowColor} {preventDefault} {stopPropagation}>
    function create_default_slot$4(ctx) {
    	let current;
    	const content_slot_template = /*#slots*/ ctx[16].content;
    	const content_slot = create_slot(content_slot_template, ctx, /*$$scope*/ ctx[18], get_content_slot_context);

    	return {
    		c() {
    			if (content_slot) content_slot.c();
    		},
    		m(target, anchor) {
    			if (content_slot) {
    				content_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (content_slot) {
    				if (content_slot.p && (!current || dirty & /*$$scope, open*/ 262145)) {
    					update_slot_base(
    						content_slot,
    						content_slot_template,
    						ctx,
    						/*$$scope*/ ctx[18],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
    						: get_slot_changes(content_slot_template, /*$$scope*/ ctx[18], dirty, get_content_slot_changes),
    						get_content_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(content_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(content_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (content_slot) content_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const target_slot_template = /*#slots*/ ctx[16].target;
    	const target_slot = create_slot(target_slot_template, ctx, /*$$scope*/ ctx[18], get_target_slot_context);
    	let if_block = /*open*/ ctx[0] && create_if_block$1(ctx);

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			if (target_slot) target_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr(div0, "class", "target svelte-meyr8b");

    			attr(div0, "style", div0_style_value = /*open*/ ctx[0]
    			? `z-index: ${/*zIndex*/ ctx[2] + 10}`
    			: '');

    			attr(div1, "class", "popover svelte-meyr8b");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			if (target_slot) {
    				target_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[17](div0);
    			append(div1, t);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", /*onClick*/ ctx[13]),
    					listen(div0, "touchend", /*onTouchEnd*/ ctx[12]),
    					listen(div0, "mouseover", /*onMouseOver*/ ctx[14]),
    					listen(div0, "mouseout", /*onMouseOut*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (target_slot) {
    				if (target_slot.p && (!current || dirty & /*$$scope, open*/ 262145)) {
    					update_slot_base(
    						target_slot,
    						target_slot_template,
    						ctx,
    						/*$$scope*/ ctx[18],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
    						: get_slot_changes(target_slot_template, /*$$scope*/ ctx[18], dirty, get_target_slot_changes),
    						get_target_slot_context
    					);
    				}
    			}

    			if (!current || dirty & /*open, zIndex*/ 5 && div0_style_value !== (div0_style_value = /*open*/ ctx[0]
    			? `z-index: ${/*zIndex*/ ctx[2] + 10}`
    			: '')) {
    				attr(div0, "style", div0_style_value);
    			}

    			if (/*open*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*open*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(target_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(target_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (target_slot) target_slot.d(detaching);
    			/*div0_binding*/ ctx[17](null);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const DEFAULT_ZINDEX = 1000;

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let targetRef;
    	const dispatch = createEventDispatcher();

    	const onOpen = () => {
    		dispatch('open');
    	};

    	let { action = 'click' } = $$props;
    	let { zIndex = DEFAULT_ZINDEX } = $$props;
    	let { arrow = true } = $$props;
    	let { placement = 'auto' } = $$props;
    	let { arrowColor = '' } = $$props;
    	let { overlayColor } = $$props;
    	let { preventDefault = false } = $$props;
    	let { stopPropagation = false } = $$props;
    	let { open = false } = $$props;

    	const setOpen = () => {
    		$$invalidate(0, open = !open);

    		if (!open) {
    			dispatch('close');
    		}
    	};

    	const eventClick = e => {
    		if (preventDefault) e.preventDefault();
    		if (stopPropagation) e.stopPropagation();
    		setOpen();
    	};

    	const eventMouseOut = ({ relatedTarget }) => {
    		if (relatedTarget.id === 'overlay' && !open) {
    			setOpen();
    		}
    	};

    	const onTouchEnd = action === 'click' ? eventClick : null;
    	const onClick = action === 'click' ? eventClick : null;
    	const setOpenTrue = () => $$invalidate(0, open = true);
    	const onMouseOver = action === 'hover' ? setOpenTrue : null;
    	const onMouseOut = action === 'hover' ? eventMouseOut : null;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			targetRef = $$value;
    			$$invalidate(9, targetRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('action' in $$props) $$invalidate(1, action = $$props.action);
    		if ('zIndex' in $$props) $$invalidate(2, zIndex = $$props.zIndex);
    		if ('arrow' in $$props) $$invalidate(3, arrow = $$props.arrow);
    		if ('placement' in $$props) $$invalidate(4, placement = $$props.placement);
    		if ('arrowColor' in $$props) $$invalidate(5, arrowColor = $$props.arrowColor);
    		if ('overlayColor' in $$props) $$invalidate(6, overlayColor = $$props.overlayColor);
    		if ('preventDefault' in $$props) $$invalidate(7, preventDefault = $$props.preventDefault);
    		if ('stopPropagation' in $$props) $$invalidate(8, stopPropagation = $$props.stopPropagation);
    		if ('open' in $$props) $$invalidate(0, open = $$props.open);
    		if ('$$scope' in $$props) $$invalidate(18, $$scope = $$props.$$scope);
    	};

    	return [
    		open,
    		action,
    		zIndex,
    		arrow,
    		placement,
    		arrowColor,
    		overlayColor,
    		preventDefault,
    		stopPropagation,
    		targetRef,
    		onOpen,
    		setOpen,
    		onTouchEnd,
    		onClick,
    		onMouseOver,
    		onMouseOut,
    		slots,
    		div0_binding,
    		$$scope
    	];
    }

    class Src extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$7, create_fragment$8, safe_not_equal, {
    			action: 1,
    			zIndex: 2,
    			arrow: 3,
    			placement: 4,
    			arrowColor: 5,
    			overlayColor: 6,
    			preventDefault: 7,
    			stopPropagation: 8,
    			open: 0
    		});
    	}
    }

    /* src\v0.3.0\components\ytgif\components\Drop.svelte generated by Svelte v3.50.1 */

    function create_target_slot(ctx) {
    	let icon;
    	let current;
    	const icon_spread_levels = [/*entryIcon*/ ctx[0]];
    	let icon_props = {};

    	for (let i = 0; i < icon_spread_levels.length; i += 1) {
    		icon_props = assign(icon_props, icon_spread_levels[i]);
    	}

    	icon = new Icon_1({ props: icon_props });

    	return {
    		c() {
    			create_component(icon.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const icon_changes = (dirty & /*entryIcon*/ 1)
    			? get_spread_update(icon_spread_levels, [get_spread_object(/*entryIcon*/ ctx[0])])
    			: {};

    			icon.$set(icon_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};
    }

    // (13:2) <svelte:fragment slot="content">
    function create_content_slot(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let span;
    	let originalpopover;
    	let current;

    	originalpopover = new Src({
    			props: {
    				action: "hover",
    				arrow: false,
    				$$slots: {
    					content: [create_content_slot],
    					target: [create_target_slot]
    				},
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			span = element("span");
    			create_component(originalpopover.$$.fragment);
    			attr(span, "class", "svelte-1h8u109");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			mount_component(originalpopover, span, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const originalpopover_changes = {};

    			if (dirty & /*$$scope, entryIcon*/ 5) {
    				originalpopover_changes.$$scope = { dirty, ctx };
    			}

    			originalpopover.$set(originalpopover_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(originalpopover.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(originalpopover.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    			destroy_component(originalpopover);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { entryIcon } = $$props;

    	$$self.$$set = $$props => {
    		if ('entryIcon' in $$props) $$invalidate(0, entryIcon = $$props.entryIcon);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [entryIcon, slots, $$scope];
    }

    class Drop extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, { entryIcon: 0 });
    	}
    }

    var options = {
        // ytgif
        restoreUrl: {
            tooltip: 'Restore YT URL',
            placement: 'left',
            on: 'link-45deg',
            data: { 'data-btn': 'url' },
            self: true,
        },
        startEnd: {
            tooltip: '{{[[start|end]]}}',
            placement: 'top',
            on: 'align-center',
            data: { 'data-btn': 'start|end' },
            self: true,
        },
        start: {
            tooltip: '{{[[start]]}}',
            placement: 'top',
            on: 'skip-end',
            data: { 'data-btn': 'start' },
        },
        end: {
            tooltip: '{{[[end]]}}',
            placement: 'top',
            on: 'skip-start',
            data: { 'data-btn': 'end' },
        },
        // timestamp
        ytgif: {
            tooltip: '{{[[yt-gif]]}}',
            placement: 'right',
            on: 'play-btn',
            data: { 'data-btn': 'yt-gif' },
        },
        swapFormats: {
            tooltip: 'Swap Formats',
            placement: 'right',
            on: 'arrow-repeat',
            data: { 'data-btn': 'swap' },
            self: true,
        },
    };

    /* src\v0.3.0\components\ytgif\components\Formatters.svelte generated by Svelte v3.50.1 */

    function create_default_slot_1(ctx) {
    	let icon0;
    	let t;
    	let icon1;
    	let current;
    	const icon0_spread_levels = [options.start];
    	let icon0_props = {};

    	for (let i = 0; i < icon0_spread_levels.length; i += 1) {
    		icon0_props = assign(icon0_props, icon0_spread_levels[i]);
    	}

    	icon0 = new Icon_1({ props: icon0_props });
    	const icon1_spread_levels = [options.end];
    	let icon1_props = {};

    	for (let i = 0; i < icon1_spread_levels.length; i += 1) {
    		icon1_props = assign(icon1_props, icon1_spread_levels[i]);
    	}

    	icon1 = new Icon_1({ props: icon1_props });

    	return {
    		c() {
    			create_component(icon0.$$.fragment);
    			t = space();
    			create_component(icon1.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(icon0, target, anchor);
    			insert(target, t, anchor);
    			mount_component(icon1, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const icon0_changes = (dirty & /*options*/ 0)
    			? get_spread_update(icon0_spread_levels, [get_spread_object(options.start)])
    			: {};

    			icon0.$set(icon0_changes);

    			const icon1_changes = (dirty & /*options*/ 0)
    			? get_spread_update(icon1_spread_levels, [get_spread_object(options.end)])
    			: {};

    			icon1.$set(icon1_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(icon0, detaching);
    			if (detaching) detach(t);
    			destroy_component(icon1, detaching);
    		}
    	};
    }

    // (12:0) <Drop {entryIcon}>
    function create_default_slot$3(ctx) {
    	let div;
    	let drop;
    	let t;
    	let icon;
    	let current;

    	drop = new Drop({
    			props: {
    				entryIcon: options.startEnd,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	const icon_spread_levels = [options.restoreUrl];
    	let icon_props = {};

    	for (let i = 0; i < icon_spread_levels.length; i += 1) {
    		icon_props = assign(icon_props, icon_spread_levels[i]);
    	}

    	icon = new Icon_1({ props: icon_props });

    	return {
    		c() {
    			div = element("div");
    			create_component(drop.$$.fragment);
    			t = space();
    			create_component(icon.$$.fragment);
    			attr(div, "class", "vertical svelte-1h7h8nv");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(drop, div, null);
    			append(div, t);
    			mount_component(icon, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const drop_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				drop_changes.$$scope = { dirty, ctx };
    			}

    			drop.$set(drop_changes);

    			const icon_changes = (dirty & /*options*/ 0)
    			? get_spread_update(icon_spread_levels, [get_spread_object(options.restoreUrl)])
    			: {};

    			icon.$set(icon_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(drop.$$.fragment, local);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(drop.$$.fragment, local);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(drop);
    			destroy_component(icon);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let drop;
    	let current;

    	drop = new Drop({
    			props: {
    				entryIcon: /*entryIcon*/ ctx[0],
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(drop.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(drop, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const drop_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				drop_changes.$$scope = { dirty, ctx };
    			}

    			drop.$set(drop_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(drop.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(drop.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(drop, detaching);
    		}
    	};
    }

    function instance$5($$self) {
    	const entryIcon = {
    		tooltip: 'Formatters',
    		placement: 'bottom',
    		on: 'arrow-down-up',
    		off: 'arrow-left-right'
    	};

    	return [entryIcon];
    }

    class Formatters extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});
    	}
    }

    /* src\v0.3.0\components\ytgif\components\TimeDisplay.svelte generated by Svelte v3.50.1 */

    function create_fragment$5(ctx) {
    	let div1;

    	return {
    		c() {
    			div1 = element("div");

    			div1.innerHTML = `<div class="timestamp iddle svelte-h0iowi"><span class="start svelte-h0iowi">00:00</span> 
		<span class="svelte-h0iowi">/</span> 
		<span class="end svelte-h0iowi">00:00</span></div>`;

    			attr(div1, "data-tooltip", "Scroll Back and forward");
    			attr(div1, "data-tooltip-conf", "bottom");
    			attr(div1, "class", "svelte-h0iowi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div1);
    		}
    	};
    }

    class TimeDisplay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src\v0.3.0\components\ytgif\components\Inserts.svelte generated by Svelte v3.50.1 */

    function create_default_slot$2(ctx) {
    	let div;
    	let icon0;
    	let t0;
    	let icon1;
    	let t1;
    	let icon2;
    	let t2;
    	let icon3;
    	let current;
    	const icon0_spread_levels = [/*options*/ ctx[1].start];
    	let icon0_props = {};

    	for (let i = 0; i < icon0_spread_levels.length; i += 1) {
    		icon0_props = assign(icon0_props, icon0_spread_levels[i]);
    	}

    	icon0 = new Icon_1({ props: icon0_props });
    	const icon1_spread_levels = [/*options*/ ctx[1].end];
    	let icon1_props = {};

    	for (let i = 0; i < icon1_spread_levels.length; i += 1) {
    		icon1_props = assign(icon1_props, icon1_spread_levels[i]);
    	}

    	icon1 = new Icon_1({ props: icon1_props });
    	const icon2_spread_levels = [/*options*/ ctx[1].speed];
    	let icon2_props = {};

    	for (let i = 0; i < icon2_spread_levels.length; i += 1) {
    		icon2_props = assign(icon2_props, icon2_spread_levels[i]);
    	}

    	icon2 = new Icon_1({ props: icon2_props });
    	const icon3_spread_levels = [/*options*/ ctx[1].reset];
    	let icon3_props = {};

    	for (let i = 0; i < icon3_spread_levels.length; i += 1) {
    		icon3_props = assign(icon3_props, icon3_spread_levels[i]);
    	}

    	icon3 = new Icon_1({ props: icon3_props });

    	return {
    		c() {
    			div = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			create_component(icon1.$$.fragment);
    			t1 = space();
    			create_component(icon2.$$.fragment);
    			t2 = space();
    			create_component(icon3.$$.fragment);
    			attr(div, "class", "vertical");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(icon0, div, null);
    			append(div, t0);
    			mount_component(icon1, div, null);
    			append(div, t1);
    			mount_component(icon2, div, null);
    			append(div, t2);
    			mount_component(icon3, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const icon0_changes = (dirty & /*options*/ 2)
    			? get_spread_update(icon0_spread_levels, [get_spread_object(/*options*/ ctx[1].start)])
    			: {};

    			icon0.$set(icon0_changes);

    			const icon1_changes = (dirty & /*options*/ 2)
    			? get_spread_update(icon1_spread_levels, [get_spread_object(/*options*/ ctx[1].end)])
    			: {};

    			icon1.$set(icon1_changes);

    			const icon2_changes = (dirty & /*options*/ 2)
    			? get_spread_update(icon2_spread_levels, [get_spread_object(/*options*/ ctx[1].speed)])
    			: {};

    			icon2.$set(icon2_changes);

    			const icon3_changes = (dirty & /*options*/ 2)
    			? get_spread_update(icon3_spread_levels, [get_spread_object(/*options*/ ctx[1].reset)])
    			: {};

    			icon3.$set(icon3_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			transition_in(icon3.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			transition_out(icon3.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    			destroy_component(icon3);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let drop;
    	let current;

    	drop = new Drop({
    			props: {
    				entryIcon: /*entryIcon*/ ctx[0],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(drop.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(drop, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const drop_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				drop_changes.$$scope = { dirty, ctx };
    			}

    			drop.$set(drop_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(drop.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(drop.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(drop, detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const entryIcon = {
    		on: 'plus-square',
    		tooltip: 'Parameters',
    		placement: 'bottom'
    	};

    	let { placement = 'right' } = $$props;

    	const options = {
    		start: {
    			tooltip: 'Insert as "start"',
    			placement,
    			on: 'arrow-bar-right',
    			data: { 'data-btn': 'start' },
    			self: true
    		},
    		end: {
    			tooltip: 'Insert as "end"',
    			placement,
    			on: 'arrow-bar-left',
    			data: { 'data-btn': 'end' },
    			self: true
    		},
    		speed: {
    			tooltip: 'Insert as "speed"',
    			placement,
    			on: 'clock-history',
    			data: { 'data-btn': 'speed' },
    			self: true
    		},
    		reset: {
    			tooltip: 'Reset Boundaries',
    			placement,
    			on: 'arrow-counterclockwise',
    			data: { 'data-btn': 'reset' },
    			self: true
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('placement' in $$props) $$invalidate(2, placement = $$props.placement);
    	};

    	return [entryIcon, options, placement];
    }

    class Inserts extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { placement: 2 });
    	}
    }

    /* src\v0.3.0\components\ytgif\Player.svelte generated by Svelte v3.50.1 */

    function create_default_slot$1(ctx) {
    	let formatters;
    	let t0;
    	let timedisplay;
    	let t1;
    	let inserts;
    	let current;
    	formatters = new Formatters({});
    	timedisplay = new TimeDisplay({});
    	inserts = new Inserts({});

    	return {
    		c() {
    			create_component(formatters.$$.fragment);
    			t0 = space();
    			create_component(timedisplay.$$.fragment);
    			t1 = space();
    			create_component(inserts.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(formatters, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(timedisplay, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(inserts, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(formatters.$$.fragment, local);
    			transition_in(timedisplay.$$.fragment, local);
    			transition_in(inserts.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(formatters.$$.fragment, local);
    			transition_out(timedisplay.$$.fragment, local);
    			transition_out(inserts.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(formatters, detaching);
    			if (detaching) detach(t0);
    			destroy_component(timedisplay, detaching);
    			if (detaching) detach(t1);
    			destroy_component(inserts, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let div;
    	let player;
    	let current;

    	player = new Player({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			create_component(player.$$.fragment);
    			set_style(div, "width", /*width*/ ctx[0]);
    			attr(div, "class", "svelte-zgj64u");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(player, div, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const player_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				player_changes.$$scope = { dirty, ctx };
    			}

    			player.$set(player_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(player);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const width = '240px';
    	return [width];
    }

    class Player_1 extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { width: 0 });
    	}

    	get width() {
    		return this.$$.ctx[0];
    	}
    }

    /* src\svelte\components\Temp.svelte generated by Svelte v3.50.1 */

    function create_fragment$2(ctx) {
    	let div3;
    	let div1;
    	let t7;
    	let div2;
    	let player;
    	let current;
    	let mounted;
    	let dispose;
    	player = new Player_1({});

    	return {
    		c() {
    			div3 = element("div");
    			div1 = element("div");

    			div1.innerHTML = `<h1 class="svelte-1b9q4xn">Click the card</h1> 
		<div class="scrollable svelte-1b9q4xn"><p class="svelte-1b9q4xn">Toggle image to cover text on card click.</p> 
			<p class="svelte-1b9q4xn">Something descriptive goes here.</p> 
			<p class="svelte-1b9q4xn">Another click brings the description back into view.</p></div>`;

    			t7 = space();
    			div2 = element("div");
    			create_component(player.$$.fragment);
    			attr(div1, "class", "text-holder svelte-1b9q4xn");
    			attr(div2, "class", "media-holder svelte-1b9q4xn");
    			attr(div3, "class", "card svelte-1b9q4xn");
    			toggle_class(div3, "toggled", /*toggled*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div1);
    			append(div3, t7);
    			append(div3, div2);
    			mount_component(player, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div2, "click", stop_propagation(prevent_default(/*click_handler_1*/ ctx[2]))),
    					listen(div3, "click", stop_propagation(prevent_default(/*click_handler*/ ctx[1])))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*toggled*/ 1) {
    				toggle_class(div3, "toggled", /*toggled*/ ctx[0]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			destroy_component(player);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let toggled = false;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => $$invalidate(0, toggled = !toggled);
    	return [toggled, click_handler, click_handler_1];
    }

    class Temp extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
    	}
    }

    /* src\svelte\components\Graph.svelte generated by Svelte v3.50.1 */
    const get_item_slot_changes = dirty => ({ "data-hash": dirty & /*dataItem*/ 16384 });
    const get_item_slot_context = ctx => ({ "data-hash": /*dataItem*/ ctx[14].id });

    // (101:4) {#if item.customDragger}
    function create_if_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "✋";
    			attr(div, "class", "dragger svelte-1ntl4c3");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (!mounted) {
    				dispose = listen(div, "pointerdown", function () {
    					if (is_function(/*movePointerDown*/ ctx[15])) /*movePointerDown*/ ctx[15].apply(this, arguments);
    				});

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (108:46)        
    function fallback_block(ctx) {
    	let temp;
    	let current;
    	temp = new Temp({});

    	return {
    		c() {
    			create_component(temp.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(temp, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(temp.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(temp.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(temp, detaching);
    		}
    	};
    }

    // (86:1) <Grid    bind:items    rowHeight={100}    let:item    let:dataItem    {cols}    let:movePointerDown>
    function create_default_slot(ctx) {
    	let div2;
    	let div0;
    	let span;
    	let t1;
    	let t2;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*dataItem*/ ctx[14]);
    	}

    	let if_block = /*item*/ ctx[13].customDragger && create_if_block(ctx);
    	const item_slot_template = /*#slots*/ ctx[5].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[9], get_item_slot_context);
    	const item_slot_or_fallback = item_slot || fallback_block();

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "✕";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			if (item_slot_or_fallback) item_slot_or_fallback.c();
    			attr(span, "class", "remove svelte-1ntl4c3");
    			attr(div0, "class", "options svelte-1ntl4c3");
    			attr(div1, "class", "item-wrapper svelte-1ntl4c3");
    			attr(div2, "class", "demo-widget svelte-1ntl4c3");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, span);
    			append(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			append(div2, t2);
    			append(div2, div1);

    			if (item_slot_or_fallback) {
    				item_slot_or_fallback.m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(span, "pointerdown", pointerdown_handler),
    					listen(span, "click", click_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*item*/ ctx[13].customDragger) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (item_slot) {
    				if (item_slot.p && (!current || dirty & /*$$scope, dataItem*/ 16896)) {
    					update_slot_base(
    						item_slot,
    						item_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(item_slot_template, /*$$scope*/ ctx[9], dirty, get_item_slot_changes),
    						get_item_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(item_slot_or_fallback, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(item_slot_or_fallback, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (if_block) if_block.d();
    			if (item_slot_or_fallback) item_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let meta0;
    	let meta1;
    	let meta2;
    	let t0;
    	let div0;
    	let button;
    	let t2;
    	let label;
    	let input;
    	let t3;
    	let t4;
    	let div1;
    	let grid;
    	let updating_items;
    	let current;
    	let mounted;
    	let dispose;

    	function grid_items_binding(value) {
    		/*grid_items_binding*/ ctx[8](value);
    	}

    	let grid_props = {
    		rowHeight: 100,
    		cols: /*cols*/ ctx[2],
    		$$slots: {
    			default: [
    				create_default_slot,
    				({ item, dataItem, movePointerDown }) => ({
    					13: item,
    					14: dataItem,
    					15: movePointerDown
    				}),
    				({ item, dataItem, movePointerDown }) => (item ? 8192 : 0) | (dataItem ? 16384 : 0) | (movePointerDown ? 32768 : 0)
    			]
    		},
    		$$scope: { ctx }
    	};

    	if (/*items*/ ctx[0] !== void 0) {
    		grid_props.items = /*items*/ ctx[0];
    	}

    	grid = new Src$1({ props: grid_props });
    	binding_callbacks.push(() => bind(grid, 'items', grid_items_binding));

    	return {
    		c() {
    			meta0 = element("meta");
    			meta1 = element("meta");
    			meta2 = element("meta");
    			t0 = space();
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Add Note";
    			t2 = space();
    			label = element("label");
    			input = element("input");
    			t3 = text("\r\n\t\tAdjust elements after removing an item");
    			t4 = space();
    			div1 = element("div");
    			create_component(grid.$$.fragment);
    			document.title = "Example — Add/Remove";
    			attr(meta0, "name", "description");
    			attr(meta0, "content", "Svelte-grid — Example — Add/Remove");
    			attr(meta1, "name", "keywords");
    			attr(meta1, "content", "draggable,resizable,grid,layout,responsive,breakpoints,Svelte,svelte,svelte.js,sveltejs,usage,example,examples,samples,add,remove,dynamic");
    			attr(meta2, "name", "author");
    			attr(meta2, "content", "Vahe Araqelyan");
    			attr(input, "type", "checkbox");
    			attr(div1, "class", "wrapper svelte-1ntl4c3");
    		},
    		m(target, anchor) {
    			append(document.head, meta0);
    			append(document.head, meta1);
    			append(document.head, meta2);
    			insert(target, t0, anchor);
    			insert(target, div0, anchor);
    			append(div0, button);
    			append(div0, t2);
    			append(div0, label);
    			append(label, input);
    			input.checked = /*adjustAfterRemove*/ ctx[1];
    			append(label, t3);
    			insert(target, t4, anchor);
    			insert(target, div1, anchor);
    			mount_component(grid, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", /*addAt*/ ctx[3]),
    					listen(input, "change", /*input_change_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*adjustAfterRemove*/ 2) {
    				input.checked = /*adjustAfterRemove*/ ctx[1];
    			}

    			const grid_changes = {};

    			if (dirty & /*$$scope, dataItem, movePointerDown, item*/ 57856) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_items && dirty & /*items*/ 1) {
    				updating_items = true;
    				grid_changes.items = /*items*/ ctx[0];
    				add_flush_callback(() => updating_items = false);
    			}

    			grid.$set(grid_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			detach(meta0);
    			detach(meta1);
    			detach(meta2);
    			if (detaching) detach(t0);
    			if (detaching) detach(div0);
    			if (detaching) detach(t4);
    			if (detaching) detach(div1);
    			destroy_component(grid);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const COLS = 6;
    const pointerdown_handler = e => e.stopPropagation();

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const id = () => '_' + Math.random().toString(36).substr(2, 9);

    	let items = [
    		{
    			[COLS]: gridHelp.item({
    				x: 0,
    				y: 0,
    				w: 3,
    				h: 2,
    				customDragger: true
    			}),
    			id: id()
    		},
    		{
    			[COLS]: gridHelp.item({
    				x: 3,
    				y: 0,
    				w: 3,
    				h: 2,
    				customDragger: true
    			}),
    			id: id()
    		}
    	];

    	const cols = [[1100, 6]];

    	const addAt = () => {
    		let newItem = {
    			6: gridHelp.item({
    				w: 3,
    				h: 2,
    				x: 0,
    				y: 0,
    				customDragger: true
    			}),
    			id: id()
    		};

    		$$invalidate(0, items = [...[newItem], ...items]);
    		$$invalidate(0, items = gridHelp.adjust(items, COLS));
    	};

    	const remove = item => {
    		$$invalidate(0, items = items.filter(value => value.id !== item.id));

    		if (adjustAfterRemove) {
    			$$invalidate(0, items = gridHelp.adjust(items, COLS));
    		}
    	};

    	let adjustAfterRemove = true;

    	function input_change_handler() {
    		adjustAfterRemove = this.checked;
    		$$invalidate(1, adjustAfterRemove);
    	}

    	const click_handler = dataItem => remove(dataItem);

    	function grid_items_binding(value) {
    		items = value;
    		$$invalidate(0, items);
    	}

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	return [
    		items,
    		adjustAfterRemove,
    		cols,
    		addAt,
    		remove,
    		slots,
    		input_change_handler,
    		click_handler,
    		grid_items_binding,
    		$$scope
    	];
    }

    class Graph extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* src\svelte\App.svelte generated by Svelte v3.50.1 */

    function create_fragment(ctx) {
    	let graph;
    	let current;
    	graph = new Graph({ props: { slot: "main-footer" } });

    	return {
    		c() {
    			create_component(graph.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(graph, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(graph.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(graph.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(graph, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $useDmmVars;
    	let $themeStore;
    	component_subscribe($$self, useDmmVars, $$value => $$invalidate(0, $useDmmVars = $$value));
    	component_subscribe($$self, themeStore, $$value => $$invalidate(1, $themeStore = $$value));

    	onMount(() => {
    		themeStore.useLocalStorage();
    		useDmmVars.useLocalStorage();
    		UpdateCssVars($themeStore.theme);
    		useDdmVars(null, $useDmmVars);
    	});

    	return [];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    return App;

}));
