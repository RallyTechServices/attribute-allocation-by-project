describe("When evaluating categories for records", function() {
    
    it("should provide a value when the record has it",function(){
        var record = {
            field: 'fred'
        };
        expect(TSCalculator.getCategoryFromRecordData(record,'field',true)).toBe('fred');
    });
    
    it("should provide 'None' when the record has nothing in the field",function(){
        var record = {
            field: null
        };
        expect(TSCalculator.getCategoryFromRecordData(record,'field',true)).toBe('None');
    });
    
    it("should provide 'None' when the record has no field",function(){
        var record = {};
        expect(TSCalculator.getCategoryFromRecordData(record,'field',true)).toBe('None');
    }); 
    
    it("should provide 'None' when the record an empty string in the field",function(){
        var record = {
            field: ""
        };
        expect(TSCalculator.getCategoryFromRecordData(record,'field',true)).toBe('None');
    });
    
    it("should provide the category of the parent if the parent has a value but the record does not",function(){
        var record = {
            field: "",
            Parent: {
                field: "fred"
            }
        };
        expect(TSCalculator.getCategoryFromRecordData(record,'field',true)).toBe('fred');
    });    
    
    it("should NOT provide the category of the parent when passing false for useParentAsDefault if the parent has a value but the record does not",function(){
        var record = {
            field: "",
            Parent: {
                field: "fred"
            }
        };
        expect(TSCalculator.getCategoryFromRecordData(record,'field',false)).toBe('None');
    });
    
    
    it("should provide the category of the record if the parent and the record both have a value",function(){
        var record = {
            field: "fred",
            Parent: {
                field: "lucy"
            }
        };
        expect(TSCalculator.getCategoryFromRecordData(record,'field',true)).toBe('fred');
    });
    
    it("should provide the name of the category if category is an object (state)", function(){
        var record = {
            State: {
                ObjectID : 46772407549,
                _objectVersion : "5",
                _p : "0",
                _rallyAPIMajor : "2",
                _rallyAPIMinor : "0",
                _ref : "/state/46772407549",
                _refObjectName : "In-Progress",
                _refObjectUUID : "0d86e57e-4d3d-46b8-a3d3-5584bc98e090",
                _type :"State"
            }
        }
        expect(TSCalculator.getCategoryFromRecordData(record,'State',true)).toBe('In-Progress');
    });
    
    it("should provide the name of the category if parent category is an object (state)", function(){
        var record = {
            State: null,
            Parent: {
                State: {
                    ObjectID : 46772407549,
                    _objectVersion : "5",
                    _p : "0",
                    _rallyAPIMajor : "2",
                    _rallyAPIMinor : "0",
                    _ref : "/state/46772407549",
                    _refObjectName : "In-Progress",
                    _refObjectUUID : "0d86e57e-4d3d-46b8-a3d3-5584bc98e090",
                    _type :"State"
                }
            }
        }
        expect(TSCalculator.getCategoryFromRecordData(record,'State',true)).toBe('In-Progress');
    });
    
});
