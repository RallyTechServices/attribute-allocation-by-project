//
// This class is tested.  Check the 'fast' automated tests before adding or modifying behavior!
//
Ext.define('TSCalculator',{
    singleton: true,

    getCategoryFromRecordData: function(recordData,fieldName,useParentAsDefault) {
        var val = recordData[fieldName];
        
        if ( useParentAsDefault && (!val || val == "None") ) {
            val = recordData.Parent && recordData.Parent[fieldName];
        }
        
        if ( Ext.isObject(val) ) {
            val = val._refObjectName;
        }
        
        if ( !val ) { 
            val = 'None';
        }
        return val;
    },
    
    getValueFromSumField: function(recordData, fieldName) {
        var val = recordData[fieldName] || 0;
        
        if ( Ext.isObject(val) ) {
            val = val.Value || 0;
        }
        
        return parseInt(val,10) || 0;
    },
    
    sortWithNone: function(array_to_sort) {
        var new_array = Ext.clone(array_to_sort);
        
        return new_array.sort(function(a,b){
            var compare_a_value = Ext.isString(a) ? a.toLowerCase() : a,
                compare_b_value = Ext.isString(b) ? b.toLowerCase() : b;
                
            if ( compare_a_value == "none" ) { compare_a_value = ' '; }
            if ( compare_b_value == "none" ) { compare_b_value = ' '; }
            
            if ( ''+compare_a_value < ''+compare_b_value ) { return -1; }
            if ( ''+compare_a_value > ''+compare_b_value ) { return 1;  }
            return 0;
        });
    },
    
    sortWithProjectUtility: function(oid_array,project_utility,defined_order) {
        var new_array = Ext.clone(oid_array);
        
        return new_array.sort(function(a,b){
            var diff = 0;
            if ( project_utility.classificationField ) {
                var compare_a_value = Ext.isNumber(a) ? project_utility.getClassification(a) : a,
                    compare_b_value = Ext.isNumber(b) ? project_utility.getClassification(b) : b;
                if ( !Ext.isEmpty(defined_order) ) { 
                    compare_a_value = Ext.Array.indexOf(defined_order, compare_a_value),
                    compare_b_value = Ext.Array.indexOf(defined_order, compare_b_value);
                    
                }
                if ( compare_a_value < compare_b_value ) { diff = -1; }
                if ( compare_a_value > compare_b_value ) { diff = 1;  }
                if ( diff !== 0 ) { return diff; }
            }
            
            // either the same classification or classification wasn't set
            var compare_a_name = Ext.isNumber(a) ? project_utility.getProjectName(a) : a,
                compare_b_name = Ext.isNumber(b) ? project_utility.getProjectName(b) : b;
                
            if ( compare_a_name < compare_b_name ) { return -1; }
            if ( compare_a_name > compare_b_name ) { return 1;  }
            return 0;
        });
    }

});