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
            
            if ( compare_a_value < compare_b_value ) { return -1; }
            if ( compare_a_value > compare_b_value ) { return 1;  }
            return 0;
        });
    }

});