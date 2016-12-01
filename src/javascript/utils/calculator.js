Ext.define('TSCalculator',{
    singleton: true,

    getCategoryFromRecordData: function(record_data,field_name) {
        var val = record_data[field_name];
        if (!val || val === "None"){
            val = record_data.Parent && record_data.Parent[field_name] || "None";
        }
        
        if ( Ext.isObject(val) ) {
            val = val._refObjectName;
        }
        return val;
    }
});