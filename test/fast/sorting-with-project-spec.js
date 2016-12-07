describe("When evaluating projects with the project tree utility", function() {
    var project_hash = {
        1: { ObjectID: 1, Name: 'Fred', classification: 'winter' },
        2: { ObjectID: 2, Name: 'Ethel', classification: 'winter' },
        3: { ObjectID: 3, Name: 'Lucy', classification: 'summer' },
        4: { ObjectID: 4, Name: 'Ricky', classification: 'fall' },
        5: { ObjectID: 5, Name: 'Little Ricky' },
        6: { ObjectID: 6, Name: 'Aura', classification: '' },
        7: { ObjectID: 7, Name: 'Adam', classification: '' },
        8: { ObjectID: 8, Name: 'Astoria', classification: 'spring' }
    };
    
    var mock_tree_utility = null;
    
    beforeEach(function() {
        Ext.define('mockProjectUtilities',{
            extend: 'CA.technicalservices.utils.ProjectUtilities',
            constructor: function(config) {
                this.projectHash = project_hash;
                this.mergeConfig(config);
            }
        });
    });

    it("should sort a series of project oids by name",function(){
        var array_to_sort = [4,1,3,2];
        mock_tree_utility = Ext.create('mockProjectUtilities',{
            
        });
        expect(TSCalculator.sortWithProjectUtility(array_to_sort,mock_tree_utility)).toEqual([2,1,3,4]);
    });
    
    it("should sort a series of project oids by name if classification field doesn't exist",function(){
        var array_to_sort = [4,1,3,2];
        mock_tree_utility = Ext.create('mockProjectUtilities',{
            classificationField: 'notafield'
        });
        expect(TSCalculator.sortWithProjectUtility(array_to_sort,mock_tree_utility)).toEqual([2,1,3,4]);
    });
    
    it("should sort a series of project oids by classification then name",function(){
        var array_to_sort = [4,1,3,2];
        mock_tree_utility = Ext.create('mockProjectUtilities',{
            classificationField: 'classification'
        });
        expect(TSCalculator.sortWithProjectUtility(array_to_sort,mock_tree_utility)).toEqual([4,3,2,1]);
    });
    
    it("should sort a series of project oids by classification then name when class is mixed",function(){
        var array_to_sort = [4,1,5,6,7,3,2];
        mock_tree_utility = Ext.create('mockProjectUtilities',{
            classificationField: 'classification'
        });
        expect(TSCalculator.sortWithProjectUtility(array_to_sort,mock_tree_utility)).toEqual([7,6,5,4,3,2,1]);
    });

    it("should sort a series of project oids by classification then name when order is provided",function(){
        var array_to_sort = [4,1,5,6,7,3,2,8];
        var order = ['winter','spring','summer','fall'];
        
        mock_tree_utility = Ext.create('mockProjectUtilities',{
            classificationField: 'classification'
        });
        expect(TSCalculator.sortWithProjectUtility(array_to_sort,mock_tree_utility,order)).toEqual([7,6,5,2,1,8,3,4]);
    });
});
