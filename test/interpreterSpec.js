describe("interpreter tests", function () {

    var object1 = {
        "__lang__": "en",
        "test": {
            "_id": 1,
            "name": "aaa",
            "o": {
                "_id": 2
            },
            "l": [
                {
                    "_id": 3,
                    "aaa": "ddd",
                    "false": 2
                },
                {
                    "_id": 4
                }
            ]
        }
    };

    var object2 = {
        "store": {
            "book": [
                {
                    "category": "reference",
                    "author": "Nigel Rees",
                    "title": "Sayings of the Century",
                    "price": 8.95
                },
                {
                    "category": "fiction",
                    "author": "Evelyn Waugh",
                    "title": "Sword of Honour",
                    "price": 12.99
                },
                {
                    "category": "fiction",
                    "author": "Herman Melville",
                    "title": "Moby Dick",
                    "isbn": "0-553-21311-3",
                    "price": 8.99
                },
                {
                    "category": "fiction",
                    "author": "J. R. R. Tolkien",
                    "title": "The Lord of the Rings",
                    "isbn": "0-395-19395-8",
                    "price": 22.99
                }
            ],
            "bicycle": {
                "color": "red",
                "price": 19.95
            },
            "k": [
                {
                    "_id": 4
                }
            ]
        }
    };

    var object3 = {
        "_id": 1,
        "a": [
            {
                "_id": 2,
                "name": "s1",
                "b": [
                    {
                        "_id": 3,
                        "name": "c11",
                        "test": null
                    },
                    {
                        "_id": 4,
                        "name": "c12"
                    }
                ]
            },
            {
                "_id": 5,
                "name": "s2",
                "b": [
                    {
                        "_id": 6,
                        "name": "c21"
                    },
                    {
                        "_id": 7,
                        "name": "c22",
                        "more": {
                            "_id": 8,
                            "name": "more"
                        }
                    }
                ]
            }
        ]
    };

    function execute(expr) {
        var op = new ObjectPath(object1);
        return op.execute(expr);
    }

    function execute2(expr) {
        var op = new ObjectPath(object2);
        return op.execute(expr);
    }

    function execute3(expr) {
        var op = new ObjectPath(object3);
        return op.execute(expr);
    }

    function assertEqual(result, expected) {
        expect(result).toEqual(expected);
    }

    function assertIsInstance(result, expected) {
        expect(result).toEqual(expected);
    }

    function assertRaises(expectedError, executable) {
        expect(executable).toThrowError(expectedError);
    }

    describe("basic expression", function () {

        it("simple types", function () {
            assertEqual(execute("null"), null);
            assertEqual(execute("true"), true);
            assertEqual(execute("false"), false);
            assertEqual(execute("''"), "");
            assertEqual(execute('""'), "");
            assertEqual(execute("2"), 2);
            assertEqual(execute("2.0"), 2.0);
        });

        it("arrays", function () {
            assertEqual(execute("[]"), []);
            assertEqual(execute("[1,2,3]"), [1, 2, 3]);
            assertEqual(execute("[false,null,true,'',\"\",2,2.0, {}]"), [false, null, true, '', "", 2, 2.0, {}])
        });

        xit("objects", function () {
            assertEqual(execute("{}"), {});
            assertEqual(execute("{a:1,b:false,c:'string'}"), {"a": 1, "b": false, "c": 'string'});
            assertEqual(execute("{'a':1,'b':false,'c':'string'}"), {"a": 1, "b": false, "c": 'string'})
        });

        it("arithm add", function () {
            assertEqual(execute("2+3"), 5);
            assertEqual(execute("2+3+4"), 9);
            assertEqual(execute("++3"), 3);
            // null is treated as neutral value
            assertEqual(execute("null+3"), 3);
            assertEqual(execute("3+null"), 3);
        });

        it("arithm sub", function () {
            assertEqual(execute("-1"), -1);
            assertEqual(execute("2-3"), 2 - 3);
            assertEqual(execute("2.2-3.4"), 2.2 - 3.4);
            assertEqual(execute("-+-3"), 3);
            assertEqual(execute("+-+3"), -3)
        });

        it("arithm mul", function () {
            assertEqual(execute("2*3*5*6"), 180)
        });

        it("arithm mod", function () {
            assertEqual(execute("2%3"), 2.0 % 3);
            assertEqual(execute("2.0%3"), 2.0 % 3);
            assertEqual(execute("float(2)%3"), parseFloat(2) % 3)
        });

        it("arithm div", function () {
            assertEqual(execute("2/3"), 2.0 / 3);
            assertEqual(execute("2.0/3"), 2.0 / 3);
            assertEqual(execute("float(2)/3"), 2.0 / 3)
        });

        it("arithm group", function () {
            assertEqual(execute("2-3+4+5-7"), 2 - 3 + 4 + 5 - 7);
            assertEqual(execute("33*2/5-2"), 33 * 2 / 5.0 - 2);
            assertEqual(execute("33-4*5+2/6"), 33 - 4 * 5 + 2 / 6.0);
            assertEqual(execute("2+2*2"), 6)
        });

        it("arithm parentheses", function () {
            assertEqual(execute("+6"), 6);
            assertEqual(execute("2+2*2"), 6);
            assertEqual(execute("2+(2*2)"), 6);
            assertEqual(execute("(2+2)*2"), 8);
            assertEqual(execute("(33-4)*5+2/6"), (33 - 4) * 5 + 2 / 6.0);
            assertEqual(execute("2/3/(4/5)*6"), 2 / 3.0 / (4 / 5.0) * 6);
            assertEqual(execute("((2+4))+6"), ((2 + 4)) + 6)
        });

        it("logic negatives", function () {
            assertEqual(execute("not false"), true);
            assertEqual(execute("not null"), true);
            assertEqual(execute("not 0"), true);
            assertEqual(execute("not 0.0"), true);
            assertEqual(execute("not ''"), true);
            assertEqual(execute("not []"), true);
            assertEqual(execute("not {}"), true)
        });

        it("logic not", function () {
            assertEqual(execute("not false"), true);
            assertEqual(execute("not not not false"), true);
        });

        it("logic or", function () {
            assertEqual(execute("1 or 2"), 1);
            assertEqual(execute("0 or 2"), 2);
            assertEqual(execute("'a' or 0 or 3"), 'a');
            //TODO: assertEqual(execute("null or false or 0 or 0.0 or '' or [] or {}"), {})
        });

        it("logic and", function () {
            assertEqual(execute("1 and 2"), 2);
            assertEqual(execute("0 and 2"), 0);
            assertEqual(execute("'a' and false and 3"), false);
            //TODO: assertEqual(execute("true and 1 and 1.0 and 'foo' and [1] and {a:1}"), {"a": 1})
        });

        ////TODO: not implemented yet!
        xit("comparison regex", function () {
            assertIsInstance(execute("/aaa/"), typeof new RegExp());
            assertEqual(execute("/.*aaa/ matches 'xxxaaaadddd'"), true);
            assertEqual(execute("'.*aaa' matches 'xxxaaaadddd'"), true)
        });

        it("comparison is", function () {
            assertEqual(execute("2 is 2"), true);
            assertEqual(execute("'2' is 2"), true);
            assertEqual(execute("2 is '2'"), true);
            assertEqual(execute("2 is 2.0"), true);
            assertEqual(execute("0.1+0.2 is 0.3"), true);
            assertEqual(execute("[] is []"), true);
            assertEqual(execute("[1] is [1]"), true);
            assertEqual(execute("{} is {}"), true);
            //TODO: assertEqual(execute("{'aaa':1} is {'aaa':1}"), true)
        });

        it("comparison isnot", function () {
            assertEqual(execute("3 is not 6"), true);
            assertEqual(execute("3 is not '3'"), false);
            assertEqual(execute("[] is not [1]"), true);
            assertEqual(execute("[] is not []"), false);
            //TODO: assertEqual(execute("{'aaa':2} is not {'bbb':2}"), true);
            assertEqual(execute("{} is not {}"), false)
        });

        it("membership in", function () {
            assertEqual(execute("4 in [6,4,3]"), true);
            //TODO: assertEqual(execute("4 in {4:true}"), true);
            assertEqual(execute("[2,3] in [6,4,3]"), true)
        });

        it("membership notin tests", function () {
            assertEqual(execute("4 not in []"), true);
            assertEqual(execute("1 not in {'232':2}"), true);
            assertEqual(execute("[2,5] not in [6,4,3]"), true)
        });

        it("complex", function () {
            assertEqual(execute("23 is not 56 or 25 is 57"), true);
            assertEqual(execute("2+3/4-6*7>0 or 10 is not 11 and 14"), 14)
        });

        it("comparison lt", function () {
            assertEqual(execute("2<3"), true);
            assertEqual(execute("3<3"), false);
            assertEqual(execute("2<=2"), true);
            assertEqual(execute("2<=1"), false)
        });

        it("comparison gt", function () {
            assertEqual(execute("5>4"), true);
            assertEqual(execute("5>5"), false);
            assertEqual(execute("5>=5"), true)
        });

        it("concatenation", function () {
            assertEqual(execute("'a'+'b'+\"c\""), 'abc');
            assertEqual(execute("'5'+5"), '55');
            assertEqual(execute("5+'5'"), 10);
            assertEqual(execute("[1,2,4] + [3,5]"), [1, 2, 4, 3, 5]);
            //TODO: assertEqual(execute('{"a":1,"b":2} + {"a":2,"c":3}'), {"a": 2, "b": 2, "c": 3});
            //assertRaises(ProgrammingError, function(){ execute('{"a":1,"b":2} + "sss"') });
        });

        it("builtin casting", function () {
            assertEqual(execute("str('foo')"), 'foo');
            assertEqual(execute("str(1)"), '1');
            //JS doesn't have a '1.0' notation
            assertEqual(execute("str(1.0)"), '1');
            assertEqual(execute("str(1 is 1)"), 'true');
            assertEqual(execute("int(1)"), 1);
            //JS doesn't have a '1.0' notation
            assertEqual(execute("int(1.0)"), 1);
            assertEqual(execute("int('1')"), 1);
            //#Python can't handle that
            assertEqual(execute("int('1.0')"), 1);
            assertEqual(execute("float(1.0)"), 1);
            assertEqual(execute("float(1)"), 1);
            assertEqual(execute("float('1')"), 1);
            assertEqual(execute("float('1.0')"), 1);
            assertEqual(execute("array()"), []);
            assertEqual(execute("array([])"), []);
            assertEqual(execute("array('abc')"), ['a', 'b', 'c']);
        });

        //Function dateTime, date, time is not implemented yet.
        xit("builtin date time functions", function () {
            assertEqual(execute("array(dateTime([2011,4,8,12,0]))"), [2011, 4, 8, 12, 0, 0, 0]);
            assertEqual(execute("array(date([2011,4,8]))"), [2011, 4, 8]);
            assertEqual(execute("array(time([12,12,30]))"), [12, 12, 30, 0])
        });

        it("builtin arithmetic", function () {
            assertEqual(execute("sum([1,2,3,4])"), [1, 2, 3, 4].reduce(function(a, b) { return a + b }));
            assertEqual(execute("sum([2,3,4,'333',[]])"), 9);
            assertEqual(execute("sum(1)"), 1);
            assertEqual(execute("min([1,2,3,4])"), Math.min([1, 2, 3, 4]));
            assertEqual(execute("min([2,3,4,'333',[]])"), 2);
            assertEqual(execute("min(1)"), 1);
            assertEqual(execute("max([1,2,3,4])"), Math.max([1, 2, 3, 4]));
            assertEqual(execute("max([2,3,4,'333',[]])"), 4);
            assertEqual(execute("max(1)"), 1);
            assertEqual(execute("avg([1,2,3,4])"), 2.5);
            assertEqual(execute("avg([1,3,3,1])"), 2.0);
            assertEqual(execute("avg([1.1,1.3,1.3,1.1])"), 1.2000000000000002);
            assertEqual(execute("avg([2,3,4,'333',[]])"), 3);
            assertEqual(execute("avg(1)"), 1);
            assertEqual(execute("round(2/3)"), Math.round(2.0 / 3));
            assertEqual(execute("round(2/3,3)"), Math.round(2.0 / 3, 3));
            // edge cases
            assertEqual(execute("avg(1)"), 1);
            // should ommit 'sss'
            assertEqual(execute("avg([1,'sss',3,3,1])"), 2.0)
        });

        it("misc functions", function () {
            assertEqual(execute("join([1,2,3],'a')"), "1a2a3");
            assertEqual(execute("join($.aaa,'a')"), null)
        });

        it("builtin string", function () {
            assertEqual(execute("replace('foobar','oob','baz')"), 'fbazar');
            assertEqual(execute("escape('&lt;')"), "&amp;lt;");
            assertEqual(execute("escape('<\"&>')"), "&lt;&quot;&amp;&gt;");
            assertEqual(execute("unescape('&lt;&quot;&amp;&gt;')"), "<\"&>");
            assertEqual(execute("upper('aaa')"), "AAA");
            assertEqual(execute("lower('AAA')"), "aaa");
            assertEqual(execute("title('AAA aaa')"), "Aaa Aaa");
            assertEqual(execute("capitalize('AAA Aaa')"), "Aaa aaa");
            assertEqual(execute("split('aaa aaa')"), ["aaa", "aaa"]);
            assertEqual(execute("split('aaaxaaa','x')"), ["aaa", "aaa"]);
            assertEqual(execute("join(['aa?','aa?'],'?')"), "aa??aa?");
            assertEqual(execute("join(['aaa','aaa'])"), "aaaaaa");
            assertEqual(execute("join(['aaa','aaa',3,55])"), "aaaaaa355");
            assertEqual(execute('slice("Hello world!", [6, 11])'), "world");
            assertEqual(execute('slice("Hello world!", [6, -1])'), "world");
            assertEqual(execute('slice("Hello world!", [[0,5], [6, 11]])'), ["Hello", "world"]);
            assertRaises(new Error(""), function(){ execute('slice()') });
            assertRaises(new Error(""), function(){ execute('slice("", {})') });
            assertEqual(execute('map(upper, ["a", "b", "c"])'), ["A", "B", "C"]);
        });

        it("builtin arrays", function () {
            assertEqual(execute("sort([1,2,3,4]+[2,4])"), [1, 2, 2, 3, 4, 4]);
            assertEqual(execute("sort($.._id)"), [1, 2, 3, 4]);
            assertEqual(execute("sort($..l.*, _id)"), [{'_id': 3, 'aaa': 'ddd', 'false': 2}, {'_id': 4}]);
            assertEqual(execute("reverse([1,2,3,4]+[2,4])"), [4, 2, 4, 3, 2, 1]);
            assertEqual(execute("reverse(sort($.._id))"), [4, 3, 2, 1]);
            assertEqual(execute("len([1,2,3,4]+[2,4])"), 6);
            // edge cases
            assertEqual(execute("len(true)"), true);
            assertEqual(execute("len('aaa')"), 3)
        });

        // date time not implemented yet
        xit("builtin time", function () {
            //import datetime
            var datetime = {'date': {}, 'time': {}, 'datetime': {}};
            assertIsInstance(execute("now()"), datetime.datetime);
            assertIsInstance(execute("date()"), datetime.date);
            assertIsInstance(execute("date(now())"), datetime.date);
            assertIsInstance(execute("date([2001,12,30])"), datetime.date);
            assertIsInstance(execute("time()"), datetime.time);
            assertIsInstance(execute("time(now())"), datetime.time);
            assertIsInstance(execute("time([12,23])"), datetime.time);
            assertIsInstance(execute("time([12,23,21,777777])"), datetime.time);
            assertIsInstance(execute("dateTime(now())"), datetime.datetime);
            assertIsInstance(execute("dateTime([2001,12,30,12,23])"), datetime.datetime);
            assertIsInstance(execute("dateTime([2001,12,30,12,23,21,777777])"), datetime.datetime);
            assertEqual(execute("toMillis(dateTime([2001,12,30,12,23,21,777777]))"), 1009715001777);
            assertIsInstance(execute("dateTime(date(),time())"), datetime.datetime);
            assertIsInstance(execute("dateTime(date(),[12,23])"), datetime.datetime);
            assertIsInstance(execute("dateTime(date(),[12,23,21,777777])"), datetime.datetime);
            assertIsInstance(execute("dateTime([2001,12,30],time())"), datetime.datetime);
            assertEqual(execute("array(time([12,30])-time([8,00]))"), [4, 30, 0, 0]);
            assertEqual(execute("array(time([12,12,12,12])-time([8,8,8,8]))"), [4, 4, 4, 4]);
            assertEqual(execute("array(time([12,12,12,12])-time([1,2,3,4]))"), [11, 10, 9, 8]);
            assertEqual(execute("array(time([12,00])-time([1,10]))"), [10, 50, 0, 0]);
            assertEqual(execute("array(time([1,00])-time([1,10]))"), [23, 50, 0, 0]);
            assertEqual(execute("array(time([0,00])-time([0,0,0,1]))"), [23, 59, 59, 9999]);
            assertEqual(execute("array(time([0,0])+time([1,1,1,1]))"), [1, 1, 1, 1]);
            assertEqual(execute("array(time([0,0])+time([1,2,3,4]))"), [1, 2, 3, 4]);
            assertEqual(execute("array(time([23,59,59,9999])+time([0,0,0,1]))"), [0, 0, 0, 0]);
            // age tests
            assertEqual(execute("age(now())"), [0, "seconds"]);
            assertEqual(execute("age(dateTime([2000,1,1,1,1]),dateTime([2001,1,1,1,1]))"), [1, "year"]);
            assertEqual(execute("age(dateTime([2000,1,1,1,1]),dateTime([2000,2,1,1,1]))"), [1, "month"]);
            assertEqual(execute("age(dateTime([2000,1,1,1,1]),dateTime([2000,1,2,1,1]))"), [1, "day"]);
            assertEqual(execute("age(dateTime([2000,1,1,1,1]),dateTime([2000,1,1,2,1]))"), [1, "hour"]);
            assertEqual(execute("age(dateTime([2000,1,1,1,1]),dateTime([2000,1,1,1,2]))"), [1, "minute"]);
            assertEqual(execute("age(dateTime([2000,1,1,1,1,1]),dateTime([2000,1,1,1,1,2]))"), [1, "second"]);
        });

        // date time not implemented yet
        xit("localize", function () {
            //these tests are passing on computers with timezone set to UTC - not the case of TravisCI
            //test of non-DST time
            assertEqual(execute("array(localize(dateTime([2000,1,1,10,10,1,0]),'Europe/Warsaw'))"), [2000, 1, 1, 11, 10, 1, 0]);
            //test of DST time
            assertEqual(execute("array(localize(dateTime([2000,7,1,10,10,1,0]),'Europe/Warsaw'))"), [2000, 7, 1, 12, 10, 1, 0])
        });

        it("builtin type", function () {
            assertEqual(execute("type([1,2,3,4]+[2,4])"), "array");
            assertEqual(execute("type({})"), "object");
            assertEqual(execute("type('')"), "str");
        });

        it("misc", function () {
            //??? assertEqual(execute(2), 2);
            assertEqual(execute('{"@aaa":1}.@aaa'), 1);
            assertEqual(execute('$ss.a'), null);
            assertEqual(execute("$..*[10]"), null);
            assertEqual(sorted(execute("keys({'a':1,'b':2})")), ['a', 'b']);
            assertRaises(Error, function () { execute('keys([])') });
            assertRaises(Error, function () { execute('blah([])') });
        });

        it("optimizations", function () {
            assertEqual(execute("$.*[@]"), execute("$.*"));
            assertIsInstance(execute_raw("$..*"), generator);
            assertIsInstance(execute_raw("$..* + $..*"), chain);
            assertIsInstance(execute_raw("$..* + 2"), chain);
            assertIsInstance(execute_raw("2 + $..*"), chain);
            assertEqual(execute("$.._id[0]"), 1);
            assertEqual(execute("sort($.._id + $.._id)[2]"), 2);
            assertIsInstance(execute("$.._id[2]"), int);
            assertEqual(execute2("$.store.book.(price)[0].price"), execute2("$.store.book[0].price"));
        });

    });

    describe("path expressions interpreter", function () {

        it("simple paths", function () {
            assertEqual(execute("$"), object1);
            assertEqual(execute("$.*"), object1);
            assertEqual(execute("$.a.b.c"), null);
            assertEqual(execute("$.a.b.c[0]"), null);
            assertEqual(execute("$.__lang__"), "en");
            assertEqual(execute("$.test.o._id"), 2);
            assertEqual(execute("$.test.l._id"), [3, 4]);
            assertEqual(execute("$.*[test].o._id"), 2);
            assertEqual(execute("$.*['test'].o._id"), 2);
            //TODO: assertEqual(execute('[1,"aa",{"a":2,"c":3},{"c":3},{"a":1,"b":2}].[a,b]'), [{"a": 2}, {"a": 1, "b": 2}]);
            assertEqual(execute2("$.store.book.[price,title][0]"), {"price": 8.95, "title": "Sayings of the Century"});
            assertEqual(execute2("$..book[*].[price,title]"), [{'price': 8.95, 'title': 'Sayings of the Century' }, {'price': 12.99, 'title': 'Sword of Honour'}, {'price': 8.99, 'title': 'Moby Dick'}, {'price': 22.99, 'title': 'The Lord of the Rings'}]);
            //TODO: assertEqual(execute2("$..book.[price,title]"), [{'price': 8.95, 'title': 'Sayings of the Century' }, {'price': 12.99, 'title': 'Sword of Honour'}, {'price': 8.99, 'title': 'Moby Dick'}, {'price': 22.99, 'title': 'The Lord of the Rings'}]);
            //TODO: assertEqual(execute2("sort($..[price,title],'price')"), [{ 'price': 8.95, 'title': 'Sayings of the Century' }, {'price': 8.99, 'title': 'Moby Dick'}, {'price': 12.99, 'title': 'Sword of Honour'}, {'price': 19.95}, {'price': 22.99, 'title': 'The Lord of the Rings'}])
            //assertIsInstance(execute("now().year"),int);
        });

        it("complex paths", function () {
            assertEqual(execute("$.._id"), [1, 2, 3, 4]);
            //TODO: assertEqual(execute("$..l"), object1["test"]["l"]);
            assertEqual(execute("$..l[*]"), object1["test"]["l"]);
            assertEqual(execute("$..l.._id"), [3, 4]);
            assertEqual(execute2("$.store.*"), object2["store"]);
            assertEqual(execute2("$.store.book.author"), ['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
            assertEqual(execute2("$.store.book.[author,aaa]"), [{"author": "Nigel Rees"}, {"author": "Evelyn Waugh"}, {"author": "Herman Melville"}, {"author": "J. R. R. Tolkien"}]);
            assertEqual(execute2("$.store.book.[author,price]"), [{'price': 8.95, 'author': 'Nigel Rees'}, {'price': 12.99, 'author': 'Evelyn Waugh'}, {'price': 8.99, 'author': 'Herman Melville'}, {'price': 22.99, 'author': 'J. R. R. Tolkien'}]);
            assertEqual(execute2("$.store.book.*[author]"), ['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
            assertEqual(execute2("$.store.book.*['author']"), ['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
            assertEqual(execute2("$.store.book"), object2["store"]["book"]);
            assertEqual(execute2("$..author"), ['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien'])
        });

        it("selectors", function () {
            assertEqual(execute("$..*[@._id>2]").length, 2);
            assertEqual(execute("$..*[3 in @.l._id]")[0], object1['test']);
            assertEqual(execute2("$.store..*[4 in @.k._id]")[0], object2['store']);
            assertEqual(execute("$..*[@._id>1 and @._id<3][0]"), {'_id': 2});
            // very bad syntax!!!
            //assertEqual(sorted(execute2("$.store.book[@.price]")), sorted([8.95,12.99,8.99,22.99]))
        });

    });

    describe("special extensions interpreter", function () {

        it("alternate selector", function () {
            assertEqual(execute3("$.a.b.[c,d]"), []);
        });

        it("flatten one level", function () {
            assertEqual(execute3("$.a.b[*].name"), ['c11', 'c12', 'c21', 'c22']);
        });

    });

});