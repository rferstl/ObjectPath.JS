var object = {
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
    "aa": [
        {
            "_id": 2,
            "name": "s1",
            "bb": [
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
            "bb": [
                {
                    "_id": 6,
                    "name": "c21"
                },
                {
                    "_id": 7,
                    "name": "c22",
                    "more": {
                        "_id": 8,
                        "name" : "more"
                    }
                }
            ]
        }
    ]
};

describe("with simple object", function () {

    var op;

    function assertEqual(expr, expected) {
        expect(op.execute(expr)).toEqual(expected);
    }

    beforeEach(function () {
        op = new ObjectPath(object);
    });

    afterEach(function () {
        op = null;
    });

    it("simple_path tests", function () {
        assertEqual("$", object);
        assertEqual("$.*", object);
        assertEqual("$.a.b.c", null);
        assertEqual("$.a.b.c[0]", null);
        assertEqual("$.__lang__", "en");
        assertEqual("$.test.o._id", 2);
        assertEqual("$.test.l._id", [3, 4]);
        //assertIsInstance("now().year",int);
    });

    it("simple path tests with wildcard and selector", function () {
        assertEqual("$.*[test].o._id", 2);
        assertEqual("$.*['test'].o._id", 2);
    });

    it("complex path tests", function () {
        assertEqual("$.._id", [1, 2, 3, 4]);
        assertEqual("$..l[0]", object["test"]["l"]);
        assertEqual("$..l.._id", [3, 4])
    });

    xit("selectors", function () {
        assertEqual("$..*[@._id>2]", 2);
        assertEqual("$..*[3 in @.l._id]", {});
        assertEqual("$..*[@._id>1 and @._id<3][0]", {'_id': 2})
    });


    it("all ids from all objects", function () {
        expect(op.execute("$.._id")).toEqual([1, 2, 3, 4]);
    });

    it("first l object", function () {
        expect(op.execute("$..l[0]")).toEqual(object["test"]["l"]);
    });

    it("all ids of all objects in l", function () {
        expect(op.execute("$..l.._id")).toEqual([3, 4]);
    });
});

describe("with object2", function () {

    var op;

    beforeEach(function () {
        op = new ObjectPath(object2);
    });

    afterEach(function () {
        op = null;
    });

    it("all properties of store object = store object", function () {
        expect(op.execute("$.store.*")).toEqual(object2["store"]);
    });

    it("all autors", function () {
        expect(op.execute("$.store.book.author")).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
    });

    it("all authors with wildcard and selector", function () {
        expect(op.execute("$.store.book.*[author]")).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
    });

    it("all authors with wildcard and selector with property name as string", function () {
        expect(op.execute("$.store.book.*['author']")).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
    });

    it("all books", function () {
        expect(op.execute("$.store.book")).toEqual(object2["store"]["book"]);
    });

    it("all authors of all objects", function () {
        expect(op.execute("$..author")).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
    });

    xit("selector with in", function () {
        expect(op.execute("$.store..*[4 in @.k._id]")).toEqual(object2['store']);
    });

    it("select book autor and title", function () {
        expect(op.execute("$.store.book.[author, title]"))
            .toEqual([
                {author: 'Nigel Rees', title: 'Sayings of the Century'},
                {author: 'Evelyn Waugh', title: 'Sword of Honour'},
                {author: 'Herman Melville', title: 'Moby Dick'},
                {author: 'J. R. R. Tolkien', title: 'The Lord of the Rings'}]
        );
    });

});

describe("with object3", function () {

    var op;

    beforeEach(function () {
        op = new ObjectPath(object3);
    });

    afterEach(function () {
        op = null;
    });

    it("all ids from all objects", function () {
        expect(op.execute("$.._id")).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("all names from all collections", function () {
        expect(op.execute("$.aa.bb..name")).toEqual(['c11', 'c12', 'c21', 'c22', 'more']);
    });

    it("all names from all objects from all collections", function () {
        expect(op.execute("$.aa.bb..*.name")).toEqual(['c11', 'c12', 'c21', 'c22', 'more']);
    });

    it("all properties from all collections", function () {
        expect(op.execute("$.aa.bb.*"))
            .toEqual([[
                {_id: 3, name: 'c11', test: null},
                { _id: 4, name: 'c12' }
            ], [
                {_id: 6, name: 'c21'},
                {_id: 7, name: 'c22', more: { _id: 8, name: 'more' } }
            ]]);
    });

    it("all names from all collections flatten one level", function () {
        expect(op.execute("$.aa.bb[*].name")).toEqual(['c11', 'c12', 'c21', 'c22']);
    });

});

describe("basic expressions interpreter test", function () {
    var op;

    function assertEqual(expr, expected) {
        expect(op.execute(expr)).toEqual(expected);
    }

    beforeEach(function () {
        op = new ObjectPath(object3);
    });

    afterEach(function () {
        op = null;
    });

    it("simple tests", function () {
        assertEqual("null", null);
        assertEqual("true", true);
        assertEqual("false", false);
        assertEqual("''", "");
        assertEqual('""', "");
        assertEqual("2+2", 4);
        assertEqual("2.0", 2.0)
    });

    it("array tests", function () {
        assertEqual("[]", []);
        //assertEqual("[{}]", [{}])
        assertEqual("[1,2,3]", [1, 2, 3]);
        assertEqual("[false,null,true,'',\"\",2,2.0]", [false, null, true, '', "", 2, 2.0/*,{}*/])
    });

    // { is not implemented yet!
    xit("object tests", function () {
        assertEqual("{}", {});
        assertEqual("{a:1,b:false,c:'string'}", {"a": 1, "b": false, "c": 'string'});
        assertEqual("{'a':1,'b':false,'c':'string'}", {"a": 1, "b": false, "c": 'string'})
    });

    it("arithm add tests", function () {
        assertEqual("2+3", 5);
        assertEqual("2+3+4", 9);
        assertEqual("++3", 3)
    });

    it("arithm sub tests", function () {
        assertEqual("-1", -1);
        assertEqual("2-3", 2 - 3);
        assertEqual("2.2-3.4", 2.2 - 3.4);
        assertEqual("-+-3", 3);
        assertEqual("+-+3", -3)
    });

    it("arithm mul tests", function () {
        assertEqual("2*3*5*6", 180)
    });

    it("arithm mod tests", function () {
        assertEqual("2%3", 2.0 % 3);
        assertEqual("2.0%3", 2.0 % 3);
        assertEqual("float(2)%3", parseFloat(2) % 3)
    });

    it("arithm div tests", function () {
        assertEqual("2/3", 2.0 / 3);
        assertEqual("2.0/3", 2.0 / 3);
        assertEqual("float(2)/3", 2.0 / 3)
    });

    it("arithm group tests", function () {
        assertEqual("2-3+4+5-7", 2 - 3 + 4 + 5 - 7);
        assertEqual("33*2/5-2", 33 * 2 / 5.0 - 2);
        assertEqual("33-4*5+2/6", 33 - 4 * 5 + 2 / 6.0);
        assertEqual("2+2*2", 6)
    });

    it("arithm parentheses tests", function () {
        assertEqual("2+(2*2)", 6);
        assertEqual("(2+2)*2", 8);
        assertEqual("(33-4)*5+2/6", (33 - 4) * 5 + 2 / 6.0);
        assertEqual("2/3/(4/5)*6", 2 / 3.0 / (4 / 5.0) * 6);
        assertEqual("((2+4))+6", ((2 + 4)) + 6)
    });

    it("logic negatives tests", function () {
        assertEqual("not false", true);
        assertEqual("not null", true);
        assertEqual("not 0", true);
        assertEqual("not 0.0", true);
        assertEqual("not ''", true);
        assertEqual("not []", false);
        //assertEqual("not {}", true)
    });

    it("logic not", function () {
        assertEqual("not false", true);
        assertEqual("not not not false", true);
        assertEqual("1 or 2", 1);
        assertEqual("0 or 2", 2);
        assertEqual("'a' or 0 or 3", 'a');
        //assertEqual("null or false or 0 or 0.0 or '' or [] or {}", {})
        assertEqual("null or false or 0 or 0.0 or ''", '')

    });

    it("logic and tests", function () {
        assertEqual("1 and 2", 2);
        assertEqual("0 and 2", 0);
        assertEqual("'a' and false and 3", false);
        //assertEqual("true and 1 and 1.0 and 'foo' and [1] and {a:1}", {"a":1})

    });

    it("comparison is tests", function () {
        assertEqual("2 is 2", true);
        assertEqual("'2' is 2", true);
        assertEqual("2 is '2'", true);
        assertEqual("2 is 2.0", true);
        assertEqual("[] is []", true);
        assertEqual("[1] is [1]", true)

    });

    it("comparison isnot tests", function () {
        assertEqual("3 is not 6", true);
        assertEqual("[] is not [1]", true)

    });

    it("membership in tests", function () {
        assertEqual("4 in [6,4,3]", true);
        //assertEqual("4 in {4:true}",true)
    });

    it("membership notin tests", function () {
        assertEqual("4 not in []", true);
        //assertEqual("1 not in {}", true)
    });

    it("complex tests", function () {
        assertEqual("23 is not 56 or 25 is 57", true);
        assertEqual("2+3/4-6*7>0 or 10 is not 11 and 14", 14)

    });

    it("comparison lt tests", function () {
        assertEqual("2<3", true);
        assertEqual("3<3", false);
        assertEqual("2<=2", true);
        assertEqual("2<=1", false)

    });

    it("comparison gt tests", function () {
        assertEqual("5>4", true);
        assertEqual("5>5", false);
        assertEqual("5>=5", true)

    });

    it("concatenation tests", function () {
        assertEqual("'a'+'b'+\"c\"", 'abc');
        assertEqual("'5'+5", '55');
        assertEqual("5+'5'", 10);
        assertEqual("[1,2,4] + [3,5]", [1, 2, 4, 3, 5]);
        //assertEqual('{"a":1,"b":2} + {"a":2,"c":3}', {"a":2,"b":2,"c":3})
    });

    it("builtin casting", function () {
        assertEqual("str('foo')", 'foo');
        assertEqual("str(1)", '1');
        //JS doesn't have a '1.0' notation
        assertEqual("str(1.0)", '1');
        assertEqual("str(1 is 1)", 'true');
        assertEqual("int(1)", 1);
        //JS doesn't have a '1.0' notation
        assertEqual("int(1.0)", 1);
        assertEqual("int('1')", 1);

        //#Python can't handle that
        assertEqual("int('1.0')", 1);
        assertEqual("float(1.0)", 1);
        assertEqual("float(1)", 1);
        assertEqual("float('1')", 1);
        assertEqual("float('1.0')", 1);
        assertEqual("array()", []);
        assertEqual("array([])", []);
        assertEqual("array('abc')", ['a', 'b', 'c']);
    });

    //Function dateTime, date, time is not implemented yet.
    xit("builtin date time functions", function () {
        assertEqual("array(dateTime([2011,4,8,12,0]))", [2011,4,8,12,0,0,0])
        assertEqual("array(date([2011,4,8]))", [2011,4,8])
        assertEqual("array(time([12,12,30]))", [12,12,30,0])
    });

    it("misc functions", function () {
        assertEqual("join([1,2,3],'a')", "1a2a3");
        assertEqual("join($.aaa,'a')", null)
    });

});
