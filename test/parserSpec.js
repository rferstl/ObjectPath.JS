

describe("parser test", function () {
    function transformChild(result, child){
        if(Array.isArray(child))
            for(var i=0; i<child.length; i++)
                result.push(transform(child[i]));
        else
            result.push(transform(child));
        return result;
    }

    function transform(node){
        if(node.id === "fn")
            return transformChild([ "f:" + node.first ], node.second);

        var head = (node.id === "(name)") ? (":" + node.value) : node.value ;
        if(!node.first && !node.second)
            return head;

        var r = [head];
        if(node.first)
            transformChild(r, node.first);
        if(node.second)
            transformChild(r, node.second);

        return r;
    }

    function assertEqual(expr, expected){
        expect(transform(op.compile(expr))).toEqual(expected);
    }

    var op;
    beforeEach(function () {
        op = new ObjectPath({});
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
        assertEqual("2+2", [ '+', 2, 2 ]);
        assertEqual("2.0", 2.0);
    });

    it("array tests", function () {
        assertEqual("[]", [ '[' ]);
        assertEqual("[{}]", [ '[', [ '{' ] ]);
        assertEqual("[1,2,3]", [ '[', 1, 2, 3 ]);
        assertEqual("[false,null,true,'',\"\",2,2.0,{}]", ['[', false, null, true, '', "", 2, 2.0, [ '{' ]]);
    });

    //not implemented yet
    xit("object tests", function () {
        assertEqual("{}", [ '{' ]);
        assertEqual("{ a:1, b:false, c:'string' }", {"a":1,"b":false,"c":'string'});
        assertEqual("{'a':1,'b':false,'c':'string'}", {"a":1,"b":false,"c":'string'});
    });

    it("arithm add tests", function () {
        assertEqual("2+3", [ '+', 2, 3 ]);
        assertEqual("2+3+4", [ '+', [ '+', 2, 3 ], 4 ]);
        assertEqual("++3", [ '+', [ '+', 3 ] ]);
    });

    it("arithm sub tests", function () {
        assertEqual("-1", [ '-', 1 ]);
        assertEqual("2-3", [ '-', 2, 3 ]);
        assertEqual("2.2-3.4", [ '-', 2.2, 3.4 ]);
        assertEqual("-+-3", [ '-', [ '+', [ '-', 3 ] ] ]);
        assertEqual("+-+3", [ '+', [ '-', [ '+', 3 ] ] ]);
    });

    it("arithm mul tests", function () {
        assertEqual("2*3*5*6", [ '*', [ '*', [ '*', 2, 3 ], 5 ], 6 ]);
    });

    it("arithm mod tests", function () {
        assertEqual("2%3", [ '%', 2, 3 ]);
        assertEqual("2.0%3", [ '%', 2, 3 ]);
        assertEqual("float(2)%3", [ '%', [ 'f:float', 2 ], 3 ]);
    });

    it("arithm div tests", function () {
        assertEqual("2/3", [ '/', 2, 3 ]);
        assertEqual("2.0/3", [ '/', 2, 3 ]);
        assertEqual("float(2)/3", [ '/', [ 'f:float', 2 ], 3 ]);
    });

    it("arithm group tests", function () {
        assertEqual("2-3+4+5-7", [ '-', [ '+', [ '+', [ '-', 2, 3 ], 4 ], 5 ], 7 ]);
        assertEqual("33*2/5-2", [ '-', [ '/', [ '*', 33, 2 ], 5 ], 2 ]);
        assertEqual("33-4*5+2/6", [ '+', [ '-', 33, [ '*', 4, 5 ] ], [ '/', 2, 6 ] ]);
        assertEqual("2+2*2", [ '+', 2, [ '*', 2, 2 ] ]);
    });

    it("arithm parentheses tests", function () {
        assertEqual("2+(2*2)", [ '+', 2, [ '*', 2, 2 ] ]);
        assertEqual("(2+2)*2", [ '*', [ '+', 2, 2 ], 2 ]);
        assertEqual("(33-4)*5+2/6", [ '+', [ '*', [ '-', 33, 4 ], 5 ], [ '/', 2, 6 ] ]);
        assertEqual("2/3/(4/5)*6", [ '*', [ '/', [ '/', 2, 3 ], [ '/', 4, 5 ] ], 6 ]);
        assertEqual("((2+4))+6", [ '+', [ '+', 2, 4 ], 6 ]);
    });

    it("logic negatives tests", function () {
        assertEqual("not false", [ 'not', false ]);
        assertEqual("not null", [ 'not', null ]);
        assertEqual("not 0", [ 'not', 0 ]);
        assertEqual("not 0.0", [ 'not', 0 ]);
        assertEqual("not ''", [ 'not', '' ]);
        assertEqual("not []", [ 'not', [ '[' ] ]);
        assertEqual("not {}", [ 'not', [ '{' ] ]);
    });

    it("logic not", function () {
        assertEqual("not false", [ 'not', false ]);
        assertEqual("not not not false", [ 'not', [ 'not', [ 'not', false ] ] ]);
        assertEqual("1 or 2", [ 'or', 1, 2 ]);
        assertEqual("0 or 2", [ 'or', 0, 2 ]);
        assertEqual("'a' or 0 or 3", [ 'or', 'a', [ 'or', 0, 3 ] ]);
        assertEqual("null or false or 0 or 0.0 or '' or [] or {}", [ 'or', null, [ 'or', false, [ 'or', 0, [ 'or', 0, [ 'or', '', [ 'or', [ '[' ], [ '{' ] ] ] ] ] ] ]);
        assertEqual("null or false or 0 or 0.0 or ''", [ 'or', null, [ 'or', false, [ 'or', 0, [ 'or', 0, '' ] ] ] ]);
    });

    it("logic and tests", function () {
        assertEqual("1 and 2", [ 'and', 1, 2 ]);
        assertEqual("0 and 2", [ 'and', 0, 2 ]);
        assertEqual("'a' and false and 3", [ 'and', 'a', [ 'and', false, 3 ] ]);
        //assertEqual("true and 1 and 1.0 and 'foo' and [1] and {a:1}", {"a":1},"JSON");
    });

    it("comparison is tests", function () {
        assertEqual("2 is 2", [ 'is', 2, 2 ]);
        assertEqual("'2' is 2", [ 'is', '2', 2 ]);
        assertEqual("2 is '2'", [ 'is', 2, '2' ]);
        assertEqual("2 is 2.0", [ 'is', 2, 2 ]);
        assertEqual("[] is []", [ 'is', [ '[' ], [ '[' ] ]);
        assertEqual("[1] is [1]", [ 'is', [ '[', 1 ], [ '[', 1 ] ]);
    });

    it("comparison isnot tests", function () {
        assertEqual("3 is not 6", [ 'is not', 3, 6 ]);
        assertEqual("[] is not [1]", [ 'is not', [ '[' ], [ '[', 1 ] ]);
    });

    it("membership in tests", function () {
        assertEqual("4 in [6,4,3]", [ 'in', 4, [ '[', 6, 4, 3 ] ]);
        //assertEqual("4 in {4:true}",true);
    });

    it("membership notin tests", function () {
        assertEqual("4 not in []", [ 'not in', 4, [ '[' ] ]);
        assertEqual("1 not in {}", [ 'not in', 1, [ '{' ] ]);
    });

    it("complex tests", function () {
        assertEqual("23 is not 56 or 25 is 57", [ 'or', [ 'is not', 23, 56 ], [ 'is', 25, 57 ] ]);
        assertEqual("2+3/4-6*7>0 or 10 is not 11 and 14", [ 'or', [ '>', [ '-', [ '+', 2, [ '/', 3, 4 ] ], [ '*', 6, 7 ] ], 0 ], [ 'and', [ 'is not', 10, 11 ], 14 ] ]);
    });

    it("comparison lt tests", function () {
        assertEqual("2<3", [ '<', 2, 3 ]);
        assertEqual("3<3", [ '<', 3, 3 ]);
        assertEqual("2<=2", [ '<=', 2, 2 ]);
        assertEqual("2<=1", [ '<=', 2, 1 ]);
    });

    it("comparison gt tests", function () {
        assertEqual("5>4", [ '>', 5, 4 ]);
        assertEqual("5>5", [ '>', 5, 5 ]);
        assertEqual("5>=5", [ '>=', 5, 5 ]);
    });

    it("concatenation tests", function () {
        assertEqual("'a'+'b'+\"c\"", [ '+', [ '+', 'a', 'b' ], 'c' ]);
        assertEqual("'5'+5", [ '+', '5', 5 ]);
        assertEqual("5+'5'", [ '+', 5, '5' ]);
        assertEqual("[1,2,4] + [3,5]", [ '+', [ '[', 1, 2, 4 ], [ '[', 3, 5 ] ]);
        //assertEqual('{"a":1,"b":2} + {"a":2,"c":3}', {"a":2,"b":2,"c":3});
    });

    it("builtin casting", function () {
        assertEqual("str('foo')", [ 'f:str', 'foo' ] );
        assertEqual("str(1)", [ 'f:str', 1 ]);
        //JS doesn't have a '1.0' notation
        assertEqual("str(1.0)", [ 'f:str', 1 ]);
        assertEqual("str(1 is 1)", [ 'f:str', [ 'is', 1, 1 ] ]);
        assertEqual("int(1)", [ 'f:int', 1 ]);
        //JS doesn't have a '1.0' notation
        assertEqual("int(1.0)", [ 'f:int', 1 ]);
        assertEqual("int('1')", [ 'f:int', '1' ]);

        assertEqual("int('1.0')", [ 'f:int', '1.0' ]);
        assertEqual("float(1.0)", [ 'f:float', 1 ]);
        assertEqual("float(1)", [ 'f:float', 1 ]);
        assertEqual("float('1')", [ 'f:float', '1' ]);
        assertEqual("float('1.0')", [ 'f:float', '1.0' ]);
        assertEqual("array()", [ 'f:array' ]);
        assertEqual("array([])", [ 'f:array', [ '[' ] ]);
        assertEqual("array('abc')", [ 'f:array', 'abc' ]);
        assertEqual("array(dateTime([2011,4,8,12,0]))", [ 'f:array', [ 'f:dateTime', [ '[', 2011, 4, 8, 12, 0 ] ] ]);
        assertEqual("array(date([2011,4,8]))", [ 'f:array', [ 'f:date', [ '[', 2011, 4, 8 ] ] ]);
        assertEqual("array(time([12,12,30]))", [ 'f:array', [ 'f:time', [ '[', 12, 12, 30 ] ] ]);
    });

    it("join array", function () {
        expect(transform(op.compile("join([1,2,3],'a')"))).toEqual([ 'f:join', [ '[', 1, 2, 3 ], 'a' ]);
    });

    it("join path selection", function () {
        expect(transform(op.compile("join($.aaa,'a')"))).toEqual([ 'f:join', [ '.', '$', ':aaa' ], 'a' ]);
    });

    it("simple name", function () {
        expect(transform(op.compile("Name"))).toEqual(':Name');
    });

    it("root object", function () {
        expect(transform(op.compile("$"))).toEqual('$');
    });

    it("spread operator on root object", function () {
        expect(transform(op.compile("$.*.Name"))).toEqual([ '.', [ '.', '$', '*' ], ':Name']);
    });

    it("child wildcard operator on root object", function () {
        expect(transform(op.compile("$.*"))).toEqual([ '.', '$', '*' ]);
    });

    it("child operator on root object with a.b.c", function () {
        expect(transform(op.compile("$.a.b.c"))).toEqual([ '.', [ '.', [ '.', '$', ':a' ], ':b' ], ':c' ]);
    });

    it("child operator and array operator", function () {
        expect(transform(op.compile("$.a.b.c[0]"))).toEqual([ '[', [ '.', [ '.', [ '.', '$', ':a' ], ':b' ], ':c' ], 0 ]);
    });

    it("child operator with wildcard and array operator", function () {
        expect(transform(op.compile("$.*[test].o._id"))).toEqual([ '.', [ '.', [ '[', [ '.', '$', '*' ], ':test' ], ':o' ], ':_id' ]);
    });

    it("child operator with wildcard and array operator with string", function () {
        expect(transform(op.compile("$.*['test'].o._id"))).toEqual([ '.', [ '.', [ '[', [ '.', '$', '*' ] , 'test' ] , ':o' ] , ':_id' ]);
    });

    it("child operator on function result", function () {
        expect(transform(op.compile("now().year"))).toEqual([ '.', [ 'f:now' ], ':year' ]);
    });

    it("recursive descent on root object and child", function () {
        expect(transform(op.compile("$.._id"))).toEqual([ '..',  '$', ':_id' ]);
    });

    it("recursive descent on root object and child and array operator", function () {
        expect(transform(op.compile("$..l[0]"))).toEqual([ '[', [ '..', '$', ':l' ], 0 ]);
    });

    it("recursive descent on root object on child object", function () {
        expect(transform(op.compile("$..l.._id"))).toEqual([ '..', [ '..', '$', ':l' ], ':_id' ]);
    });

    it("selector only", function () {
        expect(transform(op.compile("[4 in @.k._id]"))).toEqual([ '[', [ 'in', 4, [ '.', [ '.', '@', ':k' ], ':_id' ] ] ]);
    });

    it("recursive descent on store object with wildcard and selector", function () {
        expect(transform(op.compile("$.store..*[4 in @.k._id]"))).toEqual([ '[', [ '..', ['.', '$', ':store' ], '*' ], [ 'in', 4, [ '.', [ '.', '@', ':k' ], ':_id' ] ] ]);
    });

    it("recursive descent on store object with wildcard and selector 2", function () {
        expect(transform(op.compile("$..*[@._id>2]"))).toEqual([ '[', [ '..', '$', '*' ], [ '>', [ '.', '@', ':_id' ], 2 ] ]);
    });

    it("recursive descent on store object with wildcard and selector 3", function () {
        expect(transform(op.compile("$..*[3 in @.l._id]"))).toEqual([ '[', [ '..', '$', '*' ], [ 'in', 3, [ '.', [ '.', '@', ':l' ], ':_id' ] ] ]);
    });

    it("recursive descent on store object with wildcard and complex selector and array operator", function () {
        expect(transform(op.compile("$..*[@._id>1 and @._id<3][0]"))).toEqual([ '[', [ '[', [ '..', '$', '*' ], [ 'and', [ '>', [ '.', '@', ':_id' ], 1 ], [ '<', [ '.', '@', ':_id' ], 3 ] ] ], 0 ]);
    });

    it("child operator on root object and multi value selector", function () {
        expect(transform(op.compile("$.a.b.[c,d]"))).toEqual([ '.', [ '.', [ '.', '$', ':a' ], ':b' ], [ '[', ':c', ':d' ]]);
    });

    it("flatten one level", function () {
        expect(transform(op.compile("$.a.b[*]"))).toEqual([ '[', [ '.', [ '.', '$', ':a' ], ':b' ], '*' ]);
    });

});

