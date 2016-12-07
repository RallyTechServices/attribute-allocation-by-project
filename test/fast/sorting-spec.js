describe("When evaluating values for records", function() {
    
    it("should sort as expected with array that does not have 'None'",function(){
        var array_to_sort = ['a','D','c',0,'b'];
        
        expect(TSCalculator.sortWithNone(array_to_sort)).toEqual([0,'a','b','c','D']);
    });
    
    it("should sort 'None' to head of list",function(){
        var array_to_sort = ['a','D','None','c','b'];
        
        expect(TSCalculator.sortWithNone(array_to_sort)).toEqual(['None','a','b','c','D']);
    });
    
    it("should sort empty string to head of list",function(){
        var array_to_sort = ['a','D','','c','b'];
        
        expect(TSCalculator.sortWithNone(array_to_sort)).toEqual(['','a','b','c','D']);
    });
    
    it("should not fail when sorting with both None and empty string",function(){
        var array_to_sort = ['A','None','d','','c','b'];
        
        expect(TSCalculator.sortWithNone(array_to_sort)).toEqual(['','None','A','b','c','d']);
    });    
});
