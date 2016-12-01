describe("When evaluating values for records", function() {
    
    it("should provide the value when the record has a number in the field",function(){
        var record = {
            field: 25
        };
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(25);
    });
    
    it("should provide the value when the record has a stringified number in the field",function(){
        var record = {
            field: "27"
        };
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(27);
    });
    
    it("should provide 0 when the record has a string in the field",function(){
        var record = {
            field: 'fred'
        };
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(0);
    });
    
    it("should provide 0 when the record has nothing in the field",function(){
        var record = {
            field: null
        };
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(0);
    });
    
    it("should provide 0 when the record has an empty hash",function(){
        var record = {};
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(0);
    }); 
    
    it("should provide 0 when the record has an empty string in the field",function(){
        var record = {
            field: ""
        };
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(0);
    });
    
    it("should provide a value when the record has an object with a value in the field",function(){
        var record = {
            field: {
                Value: 2
            }
        };
        expect(TSCalculator.getValueFromSumField(record,'field')).toBe(2);
    });    
    
});
