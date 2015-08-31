describe("parser tests", function () {

    function transformChild(result, child) {
        if (Array.isArray(child))
            for (var i = 0; i < child.length; i++)
                result.push(transform(child[i]));
        else
            result.push(transform(child));
        return result;
    }

    function transform(node) {
        if (typeof node !== "object")
            return node;

        if (node.id === "fn")
            return transformChild(["f:" + node.first], node.second);

        var head = (node.id === "(name)") ? (":" + node.value) : node.value;
        if (!node.first && !node.second)
            return head;

        var r = [head];
        if (node.first)
            transformChild(r, node.first);
        if (node.second)
            transformChild(r, node.second);

        return r;
    }

    function compile(expr) {
        var op = new ObjectPath({});
        var tree = op.compile(expr);
        return transform(tree);
    }

    function assertEqual(result, expected) {
        expect(result).toEqual(expected);
    }

    function assertIsInstance(result, expectedType) {
        expect(result).toEqual(expectedType);
    }

    function assertRaises(expectedError, executable) {
        expect(executable).toBeDefined();
    }

    describe("basic expression", function () {

        it("simple types", function () {
            assertEqual(compile("null"), null);
            assertEqual(compile("true"), true);
            assertEqual(compile("false"), false);
            assertEqual(compile("''"), "");
            assertEqual(compile('""'), "");
            assertEqual(compile("2"), 2);
            assertEqual(compile("2.0"), 2.0);
        });

        it("arrays", function () {
            assertEqual(compile("[]"), ['[']);
            assertEqual(compile("[1,2,3]"), ['[', 1, 2, 3]);
            assertEqual(compile("[false,null,true,'',\"\",2,2.0,{}]"), ['[', false, null, true, '', "", 2, 2.0, ['{']]);
        });

        //not implemented yet!
        it("objects", function () {
            assertEqual(compile("{}"), ['{']);
            assertEqual(compile("{ a:1, b:false, c:'string' }"), ['{', [':', ':a', 1], [':', ':b', false], [':', ':c', 'string']]);
            assertEqual(compile("{'a':1,'b':false,'c':'string'}"), ['{', [':', 'a', 1], [':', 'b', false], [':', 'c', 'string']]);
        });

        it("arithm add", function () {
            assertEqual(compile("2+3"), ['+', 2, 3]);
            assertEqual(compile("2+3+4"), ['+', ['+', 2, 3], 4]);
            assertEqual(compile("++3"), ['+', ['+', 3]]);
            // null is treated as neutral value
            assertEqual(compile("null+3"), ['+', null, 3]);
            assertEqual(compile("3+null"), ['+', 3, null]);
        });

        it("arithm sub", function () {
            assertEqual(compile("-1"), ['-', 1]);
            assertEqual(compile("2-3"), ['-', 2, 3]);
            assertEqual(compile("2.2-3.4"), ['-', 2.2, 3.4]);
            assertEqual(compile("-+-3"), ['-', ['+', ['-', 3]]]);
            assertEqual(compile("+-+3"), ['+', ['-', ['+', 3]]]);
        });

        it("arithm mul", function () {
            assertEqual(compile("2*3*5*6"), ['*', ['*', ['*', 2, 3], 5], 6]);
        });

        it("arithm mod", function () {
            assertEqual(compile("2%3"), ['%', 2, 3]);
            assertEqual(compile("2.0%3"), ['%', 2, 3]);
            assertEqual(compile("float(2)%3"), ['%', ['f:float', 2], 3]);
        });

        it("arithm div", function () {
            assertEqual(compile("2/3"), ['/', 2, 3]);
            assertEqual(compile("2.0/3"), ['/', 2, 3]);
            assertEqual(compile("float(2)/3"), ['/', ['f:float', 2], 3]);
        });

        it("arithm group", function () {
            assertEqual(compile("2-3+4+5-7"), ['-', ['+', ['+', ['-', 2, 3], 4], 5], 7]);
            assertEqual(compile("33*2/5-2"), ['-', ['/', ['*', 33, 2], 5], 2]);
            assertEqual(compile("33-4*5+2/6"), ['+', ['-', 33, ['*', 4, 5]], ['/', 2, 6]]);
            assertEqual(compile("2+2*2"), ['+', 2, ['*', 2, 2]]);
        });

        it("arithm parentheses", function () {
            assertEqual(compile("+6"), ['+', 6]);
            assertEqual(compile("2+2*2"), ['+', 2, ['*', 2, 2]]);
            assertEqual(compile("2+(2*2)"), ['+', 2, ['*', 2, 2]]);
            assertEqual(compile("(2+2)*2"), ['*', ['+', 2, 2], 2]);
            assertEqual(compile("(33-4)*5+2/6"), ['+', ['*', ['-', 33, 4], 5], ['/', 2, 6]]);
            assertEqual(compile("2/3/(4/5)*6"), ['*', ['/', ['/', 2, 3], ['/', 4, 5]], 6]);
            assertEqual(compile("((2+4))+6"), ['+', ['+', 2, 4], 6]);
        });

        it("logic negatives", function () {
            assertEqual(compile("not false"), ['not', false]);
            assertEqual(compile("not null"), ['not', null]);
            assertEqual(compile("not 0"), ['not', 0]);
            assertEqual(compile("not 0.0"), ['not', 0]);
            assertEqual(compile("not ''"), ['not', '']);
            assertEqual(compile("not []"), ['not', ['[']]);
            assertEqual(compile("not {}"), ['not', ['{']]);
        });

        it("logic not", function () {
            assertEqual(compile("not false"), ['not', false]);
            assertEqual(compile("not not not false"), ['not', ['not', ['not', false]]]);
        });

        it("logic or", function () {
            assertEqual(compile("1 or 2"), ['or', 1, 2]);
            assertEqual(compile("0 or 2"), ['or', 0, 2]);
            assertEqual(compile("'a' or 0 or 3"), ['or', 'a', ['or', 0, 3]]);
            assertEqual(compile("null or false or 0 or 0.0 or '' or [] or {}"), ['or', null, ['or', false, ['or', 0, ['or', 0, ['or', '', ['or', ['['], ['{']]]]]]]);
        });

        it("logic and", function () {
            assertEqual(compile("1 and 2"), ['and', 1, 2]);
            assertEqual(compile("0 and 2"), ['and', 0, 2]);
            assertEqual(compile("'a' and false and 3"), ['and', 'a', ['and', false, 3]]);
            //TODO: assertEqual(compile("true and 1 and 1.0 and 'foo' and [1] and {a:1}"), {"a":1},"JSON");
        });

        xit("comparison regex", function () {
            assertEqual(compile("/aaa/"), ['/', 'aaa']);
            assertEqual(compile("/.*aaa/ matches 'xxxaaaadddd'"), ['matches', ['/', '.*aaa'], 'xxxaaaadddd']);
            assertEqual(compile("'.*aaa' matches 'xxxaaaadddd'"), ['matches', ['\'', '.*aaa'], 'xxxaaaadddd'])
        });

        it("comparison is", function () {
            assertEqual(compile("2 is 2"), ['is', 2, 2]);
            assertEqual(compile("'2' is 2"), ['is', '2', 2]);
            assertEqual(compile("2 is '2'"), ['is', 2, '2']);
            assertEqual(compile("2 is 2.0"), ['is', 2, 2]);
            assertEqual(compile("0.1+0.2 is 0.3"), ['is', ['+', 0.1, 0.2], 0.3]);
            assertEqual(compile("[] is []"), ['is', ['['], ['[']]);
            assertEqual(compile("[1] is [1]"), ['is', ['[', 1], ['[', 1]]);
            assertEqual(compile("{} is {}"), ['is', ['{'], ['{']]);
            assertEqual(compile("{'aaa':1} is {'aaa':1}"), ['is', ['{', [':', 'aaa', 1]], ['{', [':', 'aaa', 1]]])
        });

        it("comparison isnot", function () {
            assertEqual(compile("3 is not 6"), ['is not', 3, 6]);
            assertEqual(compile("3 is not '3'"), ['is not', 3, '3']);
            assertEqual(compile("[] is not [1]"), ['is not', ['['], ['[', 1]]);
            assertEqual(compile("[] is not []"), ['is not', ['['], ['[']]);
            assertEqual(compile("{'aaa':2} is not {'bbb':2}"), ['is not', ['{', [':', 'aaa', 2]], ['{', [':', 'bbb', 2]]]);
            assertEqual(compile("{} is not {}"), ['is not', ['{'], ['{']])
        });

        it("membership in", function () {
            assertEqual(compile("4 in [6,4,3]"), ['in', 4, ['[', 6, 4, 3]]);
            assertEqual(compile("4 in {4:true}"), ['in', 4, ['{', [':', 4, true]]]);
            assertEqual(compile("[2,3] in [6,4,3]"), ['in', ['[', 2, 3], ['[', 6, 4, 3]])
        });

        it("membership notin tests", function () {
            assertEqual(compile("4 not in []"), ['not in', 4, ['[']]);
            assertEqual(compile("1 not in {'232':2}"), ['not in', 1, ['{', [':', '232', 2]]]);
            assertEqual(compile("[2,5] not in [6,4,3]"), ['not in', ['[', 2, 5], ['[', 6, 4, 3]])
        });

        it("complex", function () {
            assertEqual(compile("23 is not 56 or 25 is 57"), ['or', ['is not', 23, 56], ['is', 25, 57]]);
            assertEqual(compile("2+3/4-6*7>0 or 10 is not 11 and 14"), ['or', ['>', ['-', ['+', 2, ['/', 3, 4]], ['*', 6, 7]], 0], ['and', ['is not', 10, 11], 14]]);
        });

        it("comparison lt", function () {
            assertEqual(compile("2<3"), ['<', 2, 3]);
            assertEqual(compile("3<3"), ['<', 3, 3]);
            assertEqual(compile("2<=2"), ['<=', 2, 2]);
            assertEqual(compile("2<=1"), ['<=', 2, 1]);
        });

        it("comparison gt", function () {
            assertEqual(compile("5>4"), ['>', 5, 4]);
            assertEqual(compile("5>5"), ['>', 5, 5]);
            assertEqual(compile("5>=5"), ['>=', 5, 5]);
        });

        it("concatenation", function () {
            assertEqual(compile("'a'+'b'+\"c\""), ['+', ['+', 'a', 'b'], 'c']);
            assertEqual(compile("'5'+5"), ['+', '5', 5]);
            assertEqual(compile("5+'5'"), ['+', 5, '5']);
            assertEqual(compile("[1,2,4] + [3,5]"), ['+', ['[', 1, 2, 4], ['[', 3, 5]]);
            assertEqual(compile('{"a":1,"b":2} + {"a":2,"c":3}'), ['+', ['{', [':', 'a', 1], [':', 'b', 2]], ['{', [':', 'a', 2], [':', 'c', 3]]]);
            assertRaises(Error, function(){ compile('{"a":1,"b":2} + "sss"') });
        });

        it("builtin casting", function () {
            assertEqual(compile("str('foo')"), ['f:str', 'foo']);
            assertEqual(compile("str(1)"), ['f:str', 1]);
            //JS doesn't have a '1.0' notation
            assertEqual(compile("str(1.0)"), ['f:str', 1]);
            assertEqual(compile("str(1 is 1)"), ['f:str', ['is', 1, 1]]);
            assertEqual(compile("int(1)"), ['f:int', 1]);
            //JS doesn't have a '1.0' notation
            assertEqual(compile("int(1.0)"), ['f:int', 1]);
            assertEqual(compile("int('1')"), ['f:int', '1']);

            assertEqual(compile("int('1.0')"), ['f:int', '1.0']);
            assertEqual(compile("float(1.0)"), ['f:float', 1]);
            assertEqual(compile("float(1)"), ['f:float', 1]);
            assertEqual(compile("float('1')"), ['f:float', '1']);
            assertEqual(compile("float('1.0')"), ['f:float', '1.0']);
            assertEqual(compile("array()"), ['f:array']);
            assertEqual(compile("array([])"), ['f:array', ['[']]);
            assertEqual(compile("array('abc')"), ['f:array', 'abc']);
        });

        //Function dateTime, date, time is not implemented yet.
        it("builtin date time functions", function () {
            assertEqual(compile("array(dateTime([2011,4,8,12,0]))"), ['f:array', ['f:dateTime', ['[', 2011, 4, 8, 12, 0]]]);
            assertEqual(compile("array(date([2011,4,8]))"), ['f:array', ['f:date', ['[', 2011, 4, 8]]]);
            assertEqual(compile("array(time([12,12,30]))"), ['f:array', ['f:time', ['[', 12, 12, 30]]]);
        });

        it("builtin arithmetic", function () {
            assertEqual(compile("sum([1,2,3,4])"), ['f:sum', ['[', 1, 2, 3, 4]]);
            assertEqual(compile("sum([2,3,4,'333',[]])"), ['f:sum', ['[', 2, 3, 4, '333', ['[']]]);
            assertEqual(compile("sum(1)"), ['f:sum', 1]);
            assertEqual(compile("min([1,2,3,4])"), ['f:min', ['[', 1, 2, 3, 4]]);
            assertEqual(compile("min([2,3,4,'333',[]])"), ['f:min', ['[', 2, 3, 4, '333', ['[']]]);
            assertEqual(compile("min(1)"), ['f:min', 1]);
            assertEqual(compile("max([1,2,3,4])"), ['f:max', ['[', 1, 2, 3, 4]]);
            assertEqual(compile("max([2,3,4,'333',[]])"), ['f:max', ['[', 2, 3, 4, '333', ['[']]]);
            assertEqual(compile("max(1)"), ['f:max', 1]);
            assertEqual(compile("avg([1,2,3,4])"), ['f:avg', ['[', 1, 2, 3, 4]]);
            assertEqual(compile("avg([1,3,3,1])"), ['f:avg', ['[', 1, 3, 3, 1]]);
            assertEqual(compile("avg([1.1,1.3,1.3,1.1])"), ['f:avg', ['[', 1.1, 1.3, 1.3, 1.1]]);
            assertEqual(compile("avg([2,3,4,'333',[]])"), ['f:avg', ['[', 2, 3, 4, '333', ['[']]]);
            assertEqual(compile("avg(1)"), ['f:avg', 1]);
            assertEqual(compile("round(2/3)"), ['f:round', ['/', 2, 3]]);
            assertEqual(compile("round(2/3,3)"), ['f:round', ['/', 2, 3], 3]);
            // edge cases
            assertEqual(compile("avg(1)"), ['f:avg', 1]);
            // should ommit 'sss'
            assertEqual(compile("avg([1,'sss',3,3,1])"), ['f:avg', ['[', 1, 'sss', 3, 3, 1]])
        });

        it("misc functions", function () {
            assertEqual(compile("join([1,2,3],'a')"), ['f:join', ['[', 1, 2, 3], 'a']);
            assertEqual(compile("join($.aaa,'a')"), ['f:join', ['.', ':$', ':aaa'], 'a']);
        });

        it("builtin string", function () {
            assertEqual(compile("replace('foobar','oob','baz')"), ['f:replace', 'foobar', 'oob', 'baz']);
            assertEqual(compile("escape('&lt;')"), ['f:escape', '&lt;']);
            assertEqual(compile("escape('<\"&>')"), ['f:escape', '<"&>']);
            assertEqual(compile("unescape('&lt;&quot;&amp;&gt;')"), ['f:unescape', '&lt;&quot;&amp;&gt;']);
            assertEqual(compile("upper('aaa')"), ['f:upper', 'aaa']);
            assertEqual(compile("lower('AAA')"), ['f:lower', 'AAA']);
            assertEqual(compile("title('AAA aaa')"), ['f:title', 'AAA aaa']);
            assertEqual(compile("capitalize('AAA Aaa')"), ['f:capitalize', 'AAA Aaa']);
            assertEqual(compile("split('aaa aaa')"), ['f:split', 'aaa aaa']);
            assertEqual(compile("split('aaaxaaa','x')"), ['f:split', 'aaaxaaa', 'x']);
            assertEqual(compile("join(['aa?','aa?'],'?')"), ['f:join', ['[', 'aa?', 'aa?'], '?']);
            assertEqual(compile("join(['aaa','aaa'])"), ['f:join', ['[', 'aaa', 'aaa']]);
            assertEqual(compile("join(['aaa','aaa',3,55])"), ['f:join', ['[', 'aaa', 'aaa', 3, 55]]);
            assertEqual(compile('slice("Hello world!", [6, 11])'), ['f:slice', 'Hello world!', ['[', 6, 11]]);
            assertEqual(compile('slice("Hello world!", [6, -1])'), ['f:slice', 'Hello world!', ['[', 6, ['-', 1]]]);
            assertEqual(compile('slice("Hello world!", [[0,5], [6, 11]])'), ['f:slice', 'Hello world!', ['[', ['[', 0, 5], ['[', 6, 11]]]);
            assertRaises(Error, function(){ compile('slice()') });
            assertRaises(Error, function(){ compile('slice("", {})') });
            assertEqual(compile('map(upper, ["a", "b", "c"])'), ['f:map', ':upper', ['[', 'a', 'b', 'c']]);
        });

        it("builtin arrays", function () {
            assertEqual(compile("sort([1,2,3,4]+[2,4])"), ['f:sort', ['+', ['[', 1, 2, 3, 4], ['[', 2, 4]]]);
            assertEqual(compile("sort($.._id)"), ['f:sort', ['..', ':$', ':_id']]);
            assertEqual(compile("sort($..l.*, _id)"), ['f:sort', ['.', ['..', ':$', ':l'], '*'], ':_id']);
            assertEqual(compile("reverse([1,2,3,4]+[2,4])"), ['f:reverse', ['+', ['[', 1, 2, 3, 4], ['[', 2, 4]]]);
            assertEqual(compile("reverse(sort($.._id))"), ['f:reverse', ['f:sort', ['..', ':$', ':_id']]]);
            assertEqual(compile("len([1,2,3,4]+[2,4])"), ['f:len', ['+', ['[', 1, 2, 3, 4], ['[', 2, 4]]]);
            // edge cases
            assertEqual(compile("len(true)"), ['f:len', true]);
            assertEqual(compile("len('aaa')"), ['f:len', 'aaa'])
        });

        // date time not implemented yet
        xit("builtin time", function () {
            //import datetime
            assertIsInstance(compile("now()"), datetime.datetime);
            assertIsInstance(compile("date()"), datetime.date);
            assertIsInstance(compile("date(now())"), datetime.date);
            assertIsInstance(compile("date([2001,12,30])"), datetime.date);
            assertIsInstance(compile("time()"), datetime.time);
            assertIsInstance(compile("time(now())"), datetime.time);
            assertIsInstance(compile("time([12,23])"), datetime.time);
            assertIsInstance(compile("time([12,23,21,777777])"), datetime.time);
            assertIsInstance(compile("dateTime(now())"), datetime.datetime);
            assertIsInstance(compile("dateTime([2001,12,30,12,23])"), datetime.datetime);
            assertIsInstance(compile("dateTime([2001,12,30,12,23,21,777777])"), datetime.datetime);
            assertEqual(compile("toMillis(dateTime([2001,12,30,12,23,21,777777]))"), 1009715001777);
            assertIsInstance(compile("dateTime(date(),time())"), datetime.datetime);
            assertIsInstance(compile("dateTime(date(),[12,23])"), datetime.datetime);
            assertIsInstance(compile("dateTime(date(),[12,23,21,777777])"), datetime.datetime);
            assertIsInstance(compile("dateTime([2001,12,30],time())"), datetime.datetime);
            assertEqual(compile("array(time([12,30])-time([8,00]))"), [4, 30, 0, 0]);
            assertEqual(compile("array(time([12,12,12,12])-time([8,8,8,8]))"), [4, 4, 4, 4]);
            assertEqual(compile("array(time([12,12,12,12])-time([1,2,3,4]))"), [11, 10, 9, 8]);
            assertEqual(compile("array(time([12,00])-time([1,10]))"), [10, 50, 0, 0]);
            assertEqual(compile("array(time([1,00])-time([1,10]))"), [23, 50, 0, 0]);
            assertEqual(compile("array(time([0,00])-time([0,0,0,1]))"), [23, 59, 59, 9999]);
            assertEqual(compile("array(time([0,0])+time([1,1,1,1]))"), [1, 1, 1, 1]);
            assertEqual(compile("array(time([0,0])+time([1,2,3,4]))"), [1, 2, 3, 4]);
            assertEqual(compile("array(time([23,59,59,9999])+time([0,0,0,1]))"), [0, 0, 0, 0]);
            // age tests
            assertEqual(compile("age(now())"), [0, "seconds"]);
            assertEqual(compile("age(dateTime([2000,1,1,1,1]),dateTime([2001,1,1,1,1]))"), [1, "year"]);
            assertEqual(compile("age(dateTime([2000,1,1,1,1]),dateTime([2000,2,1,1,1]))"), [1, "month"]);
            assertEqual(compile("age(dateTime([2000,1,1,1,1]),dateTime([2000,1,2,1,1]))"), [1, "day"]);
            assertEqual(compile("age(dateTime([2000,1,1,1,1]),dateTime([2000,1,1,2,1]))"), [1, "hour"]);
            assertEqual(compile("age(dateTime([2000,1,1,1,1]),dateTime([2000,1,1,1,2]))"), [1, "minute"]);
            assertEqual(compile("age(dateTime([2000,1,1,1,1,1]),dateTime([2000,1,1,1,1,2]))"), [1, "second"]);
        });

        // date time not implemented yet
        xit("localize", function () {
            //these tests are passing on computers with timezone set to UTC - not the case of TravisCI
            //test of non-DST time
            assertEqual(compile("array(localize(dateTime([2000,1,1,10,10,1,0]),'Europe/Warsaw'))"), [2000, 1, 1, 11, 10, 1, 0]);
            //test of DST time
            assertEqual(compile("array(localize(dateTime([2000,7,1,10,10,1,0]),'Europe/Warsaw'))"), [2000, 7, 1, 12, 10, 1, 0])
        });

        it("builtin type", function () {
            assertEqual(compile("type([1,2,3,4]+[2,4])"), ['f:type', ['+', ['[', 1, 2, 3, 4], ['[', 2, 4]]]);
            assertEqual(compile("type({})"), ['f:type', ['{']]);
            assertEqual(compile("type('')"), ['f:type', '']);
        });

        it("misc", function () {
            assertEqual(compile(2), 2);
            assertEqual(compile('{"@aaa":1}.@aaa'), ['.', ['{', [':', '@aaa', 1]], ':@aaa']);
            assertEqual(compile('$ss.a'), ['.', ':$ss', ':a']);
            assertEqual(compile("$..*[10]"), ['[', ['..', ':$', '*'], 10]);
            assertEqual(compile("keys({'a':1,'b':2})"), ['f:keys', ['{', [':', 'a', 1], [':', 'b', 2]]]);
            //assertRaises(ExecutionError, function() { compile('keys([])') });
            //assertRaises(ProgrammingError, function() { compile('blah([])') });
        });

        it("optimizations", function () {
            assertEqual(compile("$.*[@]"), ['[', ['.', ':$', '*'], ':@']);
            assertEqual(compile("$..*"), ['..', ':$', '*']);
            assertEqual(compile("$..* + $..*"), ['+', ['..', ':$', '*'], ['..', ':$', '*']]);
            assertEqual(compile("$..* + 2"), ['+', ['..', ':$', '*'], 2]);
            assertEqual(compile("2 + $..*"), ['+', 2, ['..', ':$', '*']]);
            assertEqual(compile("$.._id[0]"), ['[', ['..', ':$', ':_id'], 0]);
            assertEqual(compile("sort($.._id + $.._id)[2]"), ['[', ['f:sort', ['+', ['..', ':$', ':_id'], ['..', ':$', ':_id']]], 2]);
            assertEqual(compile("$.._id[2]"), ['[', ['..', ':$', ':_id'], 2]);
            assertEqual(compile("$.store.book.(price)[0].price"), ['.', ['[', ['.', ['.', ['.', ':$', ':store'], ':book'], ':price'], 0], ':price']);
        });

    });

    describe("path expression", function () {

        it("simple paths", function () {
            assertEqual(compile("$"), ':$');
            assertEqual(compile("$.*"), ['.', ':$', '*']);
            assertEqual(compile("$.a.b.c"), ['.', ['.', ['.', ':$', ':a'], ':b'], ':c']);
            assertEqual(compile("$.a.b.c[0]"), ['[', ['.', ['.', ['.', ':$', ':a'], ':b'], ':c'], 0]);
            assertEqual(compile("$.__lang__"), ['.', ':$', ':__lang__']);
            assertEqual(compile("$.test.o._id"), ['.', ['.', ['.', ':$', ':test'], ':o'], ':_id']);
            assertEqual(compile("$.test.l._id"), ['.', ['.', ['.', ':$', ':test'], ':l'], ':_id']);
            assertEqual(compile("$.*[test].o._id"), ['.', ['.', ['[', ['.', ':$', '*'], ':test'], ':o'], ':_id']);
            assertEqual(compile("$.*['test'].o._id"), ['.', ['.', ['[', ['.', ':$', '*'], 'test'], ':o'], ':_id']);
            assertEqual(compile('[1,"aa",{"a":2,"c":3},{"c":3},{"a":1,"b":2}].[a,b]'), ['.', ['[', 1, 'aa', ['{', [':', 'a', 2], [':', 'c', 3]], ['{', [':', 'c', 3]], ['{', [':', 'a', 1], [':', 'b', 2]]], [ '[', ':a', ':b' ]]);
            assertEqual(compile("$.store.book.[price,title][0]"), ['[', ['.', ['.', ['.', ':$', ':store'], ':book'], ['[', ':price', ':title']], 0]);
            assertEqual(compile("$..book.[price,title]"), ['.', ['..', ':$', ':book'], ['[', ':price', ':title']]);
            assertEqual(compile("sort($..[price,title],'price')"), ['f:sort', ['..', ':$', ['[', ':price', ':title']], 'price']);
            assertEqual(compile("now().year"), ['.', ['f:now'], ':year']);
        });

        it("complex paths", function () {
            assertEqual(compile("$.._id"), ['..', ':$', ':_id']);
            assertEqual(compile("$..l[0]"), ['[', ['..', ':$', ':l'], 0]);
            assertEqual(compile("$..l.._id"), ['..', ['..', ':$', ':l'], ':_id']);
            assertEqual(compile("$.store.*"), ['.', ['.', ':$', ':store'], '*']);
            assertEqual(compile("$.store.book.author"), ['.', ['.', ['.', ':$', ':store'], ':book'], ':author']);
            assertEqual(compile("$.store.book.[author,aaa]"), ['.', ['.', ['.', ':$', ':store'], ':book'], ['[', ':author', ':aaa']]);
            assertEqual(compile("$.store.book.[author,price]"), ['.', ['.', ['.', ':$', ':store'], ':book'], ['[', ':author', ':price']]);
            assertEqual(compile("$.store.book.*[author]"), ['[', ['.', ['.', ['.', ':$', ':store'], ':book'], '*'], ':author']);
            assertEqual(compile("$.store.book.*['author']"), ['[', ['.', ['.', ['.', ':$', ':store'], ':book'], '*'], 'author']);
            assertEqual(compile("$.store.book"), ['.', ['.', ':$', ':store'], ':book']);
            assertEqual(compile("$..author"), ['..', ':$', ':author'])
        });

        it("selectors", function () {
            assertEqual(compile("$..*[@._id>2]"), ['[', ['..', ':$', '*'], ['>', ['.', ':@', ':_id'], 2]]);
            assertEqual(compile("$..*[3 in @.l._id]"), ['[', ['..', ':$', '*'], ['in', 3, ['.', ['.', ':@', ':l'], ':_id']]]);
            assertEqual(compile("$..*[@._id>1 and @._id<3][0]"), ['[', ['[', ['..', ':$', '*'], ['and', ['>', ['.', ':@', ':_id'], 1], ['<', ['.', ':@', ':_id'], 3]]], 0]);
            assertEqual(compile("$..*[@._id>2]"), ['[', ['..', ':$', '*'], ['>', ['.', ':@', ':_id'], 2]]);
            assertEqual(compile("$..*[3 in @.l._id]"), ['[', ['..', ':$', '*'], ['in', 3, ['.', ['.', ':@', ':l'], ':_id']]]);
            assertEqual(compile("$.store..*[4 in @.k._id]"), ['[', ['..', ['.', ':$', ':store'], '*'], ['in', 4, ['.', ['.', ':@', ':k'], ':_id']]]);
            assertEqual(compile("$..*[@._id>1 and @._id<3][0]"), ['[', ['[', ['..', ':$', '*'], ['and', ['>', ['.', ':@', ':_id'], 1], ['<', ['.', ':@', ':_id'], 3]]], 0]);
            // very bad syntax!!!
            //assertEqual(sorted(execute2("$.store.book[@.price]")), sorted([8.95,12.99,8.99,22.99]))
        });

    });

    describe("special extensions", function () {

        it("alternate selector", function () {
            assertEqual(compile("$.a.b.[c,d]"), ['.', ['.', ['.', ':$', ':a'], ':b'], ['[', ':c', ':d']]);
        });

        it("flatten one level", function () {
            assertEqual(compile("$.a.b[*]"), ['[', ['.', ['.', ':$', ':a'], ':b'], '*']);
        });

    });

});