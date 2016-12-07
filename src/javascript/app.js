Ext.override(Rally.data.lookback.SnapshotRestProxy, {
    timeout: 300000
});
Ext.override(Rally.data.wsapi.Proxy, {
    timeout: 300000
});

Ext.define("attribute-allocation-by-project", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "techservices.attribute-allocation-by-project"
    },

    config: {
        defaultSettings: {
            projectLevel: 2,
            attributeField: 'InvestmentCategory',
            artifactType: 'PortfolioItem/Feature',
            projectClassificationField: null,
            showProjectClassifications: false,
            chartType: 'column',  //'bar' is other choice,
            query: '', //filters the results - for example if I just want to see items in a few particular states.,
            chartTitle: 'Chart Title',
            sumField: null  //or storyCount or storyPoints or featurePreliminaryEstimate
        }
    },

    chartColors: ['#FF671B','#F38B00','#FFC81F','#8DB92E'],
    artifactFetch: ['Project','ObjectID','Parent'],  //we need to get the parent so that we can also fetch the attribute field value of the parent.

    launch: function() {
        this.logger.log('launch', this._validateAppSettings());
        if (!this._validateAppSettings()){
           this.showAppMessage('Please configure an Artifact Type and Attribute Field setting.');
           return;
        }
        
        Deft.Chain.sequence([
            CA.agile.technicalservices.util.WsapiUtils.getPortfolioItemTypes,
            this.fetchAllowedClassifications
        ],this).then({ 
            success: function(results) {
                this.PortfolioItemTypes = results[0];
                this.AllowedValues = results[1];
                
                this._initializeApp();
            },
            scope: this
        });
    },
    _validateAppSettings: function(){
        this.logger.log('_validateAppSettings', this.getAttributeField(), this.getArtifactType());
        return this.getAttributeField() && this.getAttributeField().length > 0 &&
                this.getArtifactType() && this.getArtifactType().length > 0;
    },
    _initializeApp: function(){
        this.removeAll();
        this.logger.log('_initializeApp');
        this.projectUtility = Ext.create('CA.technicalservices.utils.ProjectUtilities',{
            classificationField: this.shouldShowClassification() ? this.getProjectClassificationField() : null,
            currentProject: this.getContext().getProject().ObjectID,
            listeners: {
                onerror: this.showErrorNotification,
                ready: this.fetchArtifacts,
                scope: this
            }
        });
    },
    
    fetchArtifacts: function(){
        var me = this;
        this.setLoading(true);
        
        Deft.Chain.pipeline([
            this._fetchParentArtifacts,
            this._fetchChildArtifacts,
            this.buildChart
        ],this).then({
            failure: function(msg) {
                var msg = Ext.String.format("Error fetching {0} artifacts: {1}",this.getArtifactType(),msg);
                this.showErrorNotification(msg);
            },
            scope: this
        }).always(function() { me.setLoading(false); });
    },
    
    // This fetches the configured artifact type
    _fetchParentArtifacts: function() {
        this.setLoading("Fetching " + this.getArtifactType() + "s...");

        var config = {
            model   : this.getArtifactType(),
            fetch   : this.getArtifactFetch(),
            filters : this.getArtifactFilters(),
            limit   : Infinity,
            pageSize: 2000,
            compact : false
        };
        
        return CA.agile.technicalservices.util.WsapiUtils.loadWsapiRecordsParallel(config);
    },
    
    // If feature is chosen, we skip this step
    // If initiative is chosen, we use that to constrain which features to get
    _fetchChildArtifacts: function(initiatives) {
        if ( this.getArtifactType() == this.getLowestLevelPITypePath() ) {
            return initiatives;
        }
        this.setLoading("Fetching " + this.getLowestLevelPITypePath() + "s...");
        
        var filter_array = Ext.Array.map(initiatives, function(initiative){
            return {property:'Parent.ObjectID',value:initiative.get('ObjectID')};
        });
        
        if ( filter_array.length == 0 ) {
            filter_array = [{property:'Parent.ObjectID',value:-1}];
        }
        
        this.logger.log('_fetchChildArtifacts with # of filters: ', filter_array.length);
        
        var config = {
            model   : this.getLowestLevelPITypePath(),
            fetch   : this.getArtifactFetch(),
            filters : Rally.data.wsapi.Filter.or(filter_array),
            limit   : Infinity,
            pageSize: 2000,
            compact : false,
            context: {project: null},
            enablePostGet: true
        };
        
        return CA.agile.technicalservices.util.WsapiUtils.loadWsapiRecordsParallel(config);
    },
    
    prepareChartData: function(records) {
        this.setLoading('Preparing Data....');
        
        var field = this.getAttributeField(),
            sumField = this.getSumField();
        
        var hash = {},
            groupingKeys = [],
            projectKeys = [];
    
        for (var i=0; i<records.length; i++){
            var rec = records[i].getData();
    
            var use_parent = (this.getArtifactType() != this.getLowestLevelPITypePath());
            
            var group_name = TSCalculator.getCategoryFromRecordData(rec,field,use_parent);
            
            var project_oid = this.projectUtility.getProjectAncestor(rec.Project.ObjectID, this.getProjectLevel());
            if ( this.getArtifactType() != this.getLowestLevelPITypePath() ) {
                if ( !rec.Parent ) {
                    continue;
                }
                project_oid = this.projectUtility.getProjectAncestor(rec.Parent.Project.ObjectID, this.getProjectLevel());
            }
            
            if (project_oid){
                groupingKeys = Ext.Array.merge(groupingKeys, [group_name]);
                projectKeys = Ext.Array.merge(projectKeys, [project_oid]);
                
                if (!hash[group_name]){
                    hash[group_name] = {};
                }
                if (!hash[group_name][project_oid]){
                    hash[group_name][project_oid] = 0;
                }
    
                if (sumField){
                    hash[group_name][project_oid] += TSCalculator.getValueFromSumField(rec,sumField);
                } else {
                    hash[group_name][project_oid]++;
                }
            }
        }
    
        var series = [],
            project_oids_in_order = TSCalculator.sortWithProjectUtility(projectKeys,this.projectUtility,this.AllowedValues);

        var categories = Ext.Array.map(project_oids_in_order,function(oid){
            return this.projectUtility.getProjectName(oid);
        },this);
        
        Ext.Array.each(TSCalculator.sortWithNone(groupingKeys), function(group_name) {
            var data = [];
            Ext.Array.each(project_oids_in_order, function(project_oid){
                data.push( hash[group_name][project_oid] || 0 );
            });
            var series_data = {
                name: group_name,
                data: data
            };
            
            if ( group_name == 'None' ) {
                series_data.color = '#a3a3a3';
            }
            
            series.push(series_data);
        });
        
        return {
            series: series,
            categories: categories,
            plotBands: this._getPlotBands(project_oids_in_order)
        };
    },
    
    _getPlotBands: function(project_oids) {
        // assuming project_oids are already in category order
        if ( this.getSetting('chartType') == 'bar' ) { return; }
        
        var plot_bands = [];
        var align = ( this.getSetting('chartType') == 'column' ) ? 'center' : 'right';
        
        var classifications = {};
        Ext.Array.each(project_oids, function(project_oid,idx){
            var classification = this.projectUtility.getClassification(project_oid);
            if ( Ext.isEmpty(classification) ) { return; }
            
            if ( Ext.isEmpty(classifications[classification]) ) {
                classifications[classification] = [];
            }
            classifications[classification].push(idx);
        },this);
        
        var last_color = null,
            last_offset = null;
        
        Ext.Object.each(classifications, function(classification,indices){
            if ( Ext.isEmpty(classification) ) {
                return;
            }
            
            var color = '#ccc',
                offset = 20;
            
            if ( last_color == '#ccc' ) { color = '#eee'; }
            if ( last_offset === 20 ) { offset = 40; }
            
            var from = Ext.Array.min(indices) - 0.5,
                to   = Ext.Array.max(indices) + 0.5;
            plot_bands.push({
                color: color,
                from: from,
                to: to,
                label: {
                    text: classification,
                    align: align,
                    y: offset,
                    useHTML: true // so it sits on top of all the plot bands
                },
                
//                borderColor: '#fff',
//                borderWidth: 2
            });
            last_color = color;
            last_offset = offset;
        });
        
        return plot_bands;
    },
    
    buildChart: function(records){
        this.logger.log('buildRecords');

        if (records.length === 0){
            this.showAppMessage("No records found for the selected criteria.");
            return;
        }
        this.setLoading('Preparing Data....');

        var chart_data = this.prepareChartData(records);
        var plot_bands = chart_data.plotBands || [];
                
        var height = Math.max(400,chart_data.categories.length * 30);
        var yMax   = 100;
        
        if ( this.getChartType().toLowerCase() == "column" ) {
            height = Math.max(300,this.getHeight()-50);
            if ( this.shouldShowClassification() ) {
                yMax   = 120;
            }
        }
        
        this.add({
            xtype: 'rallychart',
            height: height,
            chartColors: this.chartColors,
            chartData: chart_data,
            chartConfig: {
                chart: {
                    type: this.getChartType()
                },
                title: {
                    text: this.getChartTitle(),
                    style: {
                        color: '#666',
                        fontSize: '18px',
                        fontFamily: 'ProximaNova',
                        fill: '#666'
                    }
                },
                xAxis: {
                    categories: chart_data.categories,
                    plotBands: plot_bands,
                    
                    labels: {
                        style: {
                            color: '#444',
                            fontFamily:'ProximaNova',
                            textTransform: 'uppercase',
                            fill:'#444'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    max: yMax,
                    labels: {
                        format: "{value}%",
                        style: {
                            color: '#444',
                            fontFamily:'ProximaNova',
                            textTransform: 'uppercase',
                            fill:'#444'
                        }
                    },
                    title: {
                        text: null
                    }

                },
                tooltip: {
                    pointFormat: '<span style="font-family:ProximaNova;color:{series.color}">{series.name}</span>: <span style="font-family:ProximaNova;color:white;">{point.y} ({point.percentage:.0f}%)</span><br/>',
                    backgroundColor: '#444',
                    headerFormat: '<span style="display:block;margin:0;padding:0 0 2px 0;text-align:center"><b style="font-family:NotoSansBold;color:white;">{point.key}</b></span><table><tbody>',
                    footerFormat: '</tbody></table>',
                    shared: true,
                    useHTML: true,
                    borderColor: '#444'
                },
                legend: {
                    itemStyle: {
                        color: '#444',
                        fontFamily:'ProximaNova',
                        textTransform: 'uppercase'
                    },
                    borderWidth: 0
                },
                plotOptions: {
                    series: {
                        stacking: 'percent'
                    }
                }
            }
        });
        
        this.setLoading(false);
        return;
    },
    showAppMessage: function(msg){
        this.removeAll();
        var ct = this.add({
            xtype: 'container',
            tpl: '<div class="no-data-container"><div class="secondary-message">{message}</div></div>'
        });
        ct.update({message: msg});
    },
    showErrorNotification: function(msg){
        this.logger.log('showErrorNotification', msg);
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    getProjectClassificationField: function(){
        return this.getSetting('projectClassificationField');
    },
    getChartType: function(){
        return this.getSetting('chartType');
    },
    getChartTitle: function(){
        return this.getSetting('chartTitle');
    },
    getAttributeField: function(){
        return this.getSetting('attributeField');
    },
    getArtifactType: function(){
        return this.getSetting('artifactType');
    },
    getLowestLevelPITypePath: function() {
        return this.PortfolioItemTypes[0].get('TypePath');
    },
    fetchAllowedClassifications: function() {
        var model = 'Project',
            field = this.getProjectClassificationField();
        
        if ( !this.shouldShowClassification() ) { return null; }
        return CA.agile.technicalservices.util.WsapiUtils.fetchAllowedValues(model,field);
    },
    
    shouldShowClassification: function() {
        this.logger.log('shouldShowClassification', this.getSetting('showProjectClassification'));
        return this.getSetting('showProjectClassification');
    },
    getSumField: function(){
        if (this.getSetting('sumField') && this.getSetting('sumField') === "PreliminaryEstimate"){
            return 'PreliminaryEstimateValue';
        }
        return this.getSetting('sumField') || null;
    },
    getArtifactFetch: function(){
        var fetch = Ext.Array.merge(this.artifactFetch, [this.getAttributeField()]);
        if (this.getSumField()){
            fetch.push(this.getSumField());
        }
        return fetch;
    },
    getArtifactFilters: function(){
        var queryFilter = [];
        if (this.getSetting('query')){
            queryFilter = Rally.data.wsapi.Filter.fromQueryString(this.getSetting('query'));
        }
        return queryFilter;
    },
    getProjectLevel: function(){
        return this.getSetting('projectLevel') || 1;
    },
    getSettingsFields: function(){
        var labelWidth = 200,
            showProjectClassification = this.getSetting('showProjectClassification') || false,
            chartType = this.getChartType();

        return [{
            xtype: 'rallynumberfield',
            name: 'projectLevel',
            minValue: 1,
            maxValue: 9,
            fieldLabel: 'Relative Project Level',
            labelAlign: 'right',
            labelWidth: labelWidth
        },{
            xtype: 'rallycombobox',
            name: 'artifactType',
            storeConfig: {
                model: 'TypeDefinition',
                filters: [{
                    property: 'TypePath',
                    operator: 'contains',
                    value: 'PortfolioItem/'
                },{
                    property:'Ordinal',
                    operator: '<',
                    value: 2
                }],
                remoteFilter: true
            },
            fieldLabel: 'Artifact Type',
            labelAlign: 'right',
            labelWidth: labelWidth,
            valueField: 'TypePath',
            bubbleEvents: ['select','ready']
        },{
            xtype: 'rallyfieldcombobox',
            name: 'attributeField',
            model: 'PortfolioItem/Feature',
            fieldLabel: 'Attribute Type',
            labelAlign: 'right',
            labelWidth: labelWidth,
            _isNotHidden: function(field) {

                var blackList = ['Subscription','Workspace','Parent',
                    'RevisionHistory','PortfolioItemType'];  
                
                if (Ext.Array.contains(blackList, field.name)) { return false; }
                
                if ( field.hidden ) { return false; }
                var defn = field.attributeDefinition;
                if ( !field.attributeDefinition) { return false; }
                
                if ( defn.AttributeType == 'STRING' && defn.Constrained ) {
                    return true;
                }       
                if ( defn.AttributeType == 'RATING' ) {
                    return true;
                }
                
                if (defn.AttributeType == "OBJECT" ) {
                    return true;
                }
                
                return false;
            },
            handlesEvents: {
                ready: function(cb){
                    if (cb.getValue()){
                        this.refreshWithNewModelType(cb.getValue());
                    }
                },
                select: function(cb){
                    if (cb.getValue()){
                        this.refreshWithNewModelType(cb.getValue());
                    }
                }
            }
        },{
            xtype: 'rallyfieldcombobox',
            name: 'sumField',
            model: 'PortfolioItem/Feature',
            fieldLabel: 'Sum Field',
            labelAlign: 'right',
            labelWidth: labelWidth,
            allowNoEntry: true,
            noEntryText: 'Feature Count',
            _isNotHidden: function(field){
                var allowedFields = ['PreliminaryEstimate','RefinedEstimate','LeafStoryCount','LeafStoryPlanEstimateTotal','AcceptedLeafStoryPlanEstimateTotal','AcceptedLeafStoryCount'];
                return Ext.Array.contains(allowedFields, field.name);

                //return (field.name === 'PreliminaryEstimate') ||
                //    (field.attributeDefinition && (field.attributeDefinition.AttributeType === 'QUANTITY' ||
                //            field.attributeDefinition.AttributeType === 'DECIMAL' ||
                //            field.attributeDefinition.AttributeType === 'INTEGER'));
            },
            handlesEvents: {
                ready: function(cb){
                    if (cb.getValue()){
                        this.refreshWithNewModelType(cb.getValue());
                    }
                },
                select: function(cb){
                    if (cb.getValue()){
                        this.refreshWithNewModelType(cb.getValue());
                    }
                }
            }
        },{
            xtype: 'rallycheckboxfield',
            name: 'showProjectClassification',
            bubbleEvents: ['change'],
            fieldLabel: 'Show Project Classifications',
            labelAlign: 'right',
            labelWidth: labelWidth,
            value: showProjectClassification

        },{
            xtype: 'rallyfieldcombobox',
            name: 'projectClassificationField',
            model: 'Project',
            fieldLabel: 'Project Classification Field',
            labelAlign: 'right',
            labelWidth: labelWidth,
            disabled: showProjectClassification !== true,
            handlesEvents: {
                change: function(chk, newValue) {
                    this.setDisabled(newValue !== true);
                }
            },
            _isNotHidden: function(field) {
                var blackList = ['Subscription','Workspace','Parent',
                    'RevisionHistory','PortfolioItemType'];  
                
                if (Ext.Array.contains(blackList, field.name)) { return false; }
                
                if ( field.hidden ) { return false; }
                var defn = field.attributeDefinition;
                if ( !field.attributeDefinition) { return false; }
                
                if ( defn.AttributeType == 'STRING' && defn.Constrained ) {
                    return true;
                }       
                if (defn.AttributeType == "OBJECT" ) {
                    return true;
                }
                
                return false;
            }
        },{
            xtype: 'radiogroup',
            fieldLabel: 'Chart Type',
            labelAlign: 'right',
            labelWidth: labelWidth,
            // Arrange radio buttons into two columns, distributed vertically
            columns: 6,
            vertical: true,
            items: [
                { boxLabel: 'Column', name: 'chartType', inputValue: 'column', checked: chartType === 'column'},
                { boxLabel: 'Bar', name: 'chartType', inputValue: 'bar', checked: chartType === 'bar' }
            ]
        },{
            xtype: 'rallytextfield',
            name: 'chartTitle',
            fieldLabel: 'Chart Title',
            labelAlign: 'right',
            labelWidth: labelWidth,
            emptyText: 'Enter a Chart Title...',
            maxLength: 255,
            anchor: '100%',
            margin: '0 70 0 0'
        },{
            xtype: 'textarea',
            fieldLabel: 'Query Filter',
            name: 'query',
            anchor: '100%',
            cls: 'query-field',
            margin: '10 70 0 0',
            labelAlign: 'right',
            labelWidth: labelWidth,
            plugins: [
                {
                    ptype: 'rallyhelpfield',
                    helpId: 194
                },
                'rallyfieldvalidationui'
            ],
            validateOnBlur: false,
            validateOnChange: false,
            validator: function(value) {
                try {
                    if (value) {
                        Rally.data.wsapi.Filter.fromQueryString(value);
                    }
                    return true;
                } catch (e) {
                    return e.message;
                }
            }
        }];
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    }
});
