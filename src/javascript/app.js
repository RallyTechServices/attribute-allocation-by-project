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
        
        this.getPortfolioItemTypes().then({ 
            success: function(pis) {
                this.PortfolioItemTypes = pis;
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
            fetch: [this.getProjectClassificationField()],
            currentProject: this.getContext().getProject().ObjectID,
            listeners: {
                onerror: this.showErrorNotification,
                ready: this.fetchArtifacts,
                scope: this
            }
        });
    },
    
    fetchArtifacts: function(){
        this.logger.log('fetchArtifacts', this.projectUtility, this.getArtifactFilters().toString(),this.getArtifactType(),this.getArtifactFetch());
        this.setLoading(true);
        Ext.create('Rally.data.wsapi.Store',{
            model: this.getLowestLevelPITypePath(), //this.getArtifactType(),
            fetch: this.getArtifactFetch(),
            filters: this.getArtifactFilters(),
            limit: Infinity,
            pageSize: 2000,
            compact: false
           // context: {project: null}
        }).load({
            callback: function(records, operation){
                this.setLoading(false);
                if (operation.wasSuccessful()){
                    this.buildChart(records);
                } else {
                    var msg = Ext.String.format("Error fetching {0} artifacts:  {1}",this.getArtifactType(),operation && operation.error && operation.error.errors.join(','));
                    this.showErrorNotification(msg);
                }
            },
            scope: this
        });
    },
    
    prepareChartData: function(records) {
        this.logger.log('prepareChartData');
        var field = this.getAttributeField(),
        sumField = this.getSumField();
        var hash = {},
            valueKeys = [],
            projectKeys = [];
    
        for (var i=0; i<records.length; i++){
            var rec = records[i].getData();
    
            var val = rec[field];
            if (!val || val === "None"){
                val = rec.Parent && rec.Parent[field] || "None";
               // this.logger.log('using parent value: ', val);
            }
            
            var project = this.projectUtility.getProjectAncestor(rec.Project.ObjectID, this.getProjectLevel());
            if ( this.getArtifactType() != this.getLowestLevelPITypePath() ) {
                if ( !rec.Parent ) {
                    continue;
                }
                
                project = this.projectUtility.getProjectAncestor(rec.Parent.Project.ObjectID, this.getProjectLevel());
            }
            
            
            if (project){
                if (!Ext.Array.contains(valueKeys, val)){
                    valueKeys.push(val);
                }
                if (!Ext.Array.contains(projectKeys, project)){
                    projectKeys.push(project);
                }
    
                if (!hash[val]){
                    hash[val] = {};
                }
                if (!hash[val][project]){
                    hash[val][project] = 0;
                }
    
                if (sumField){
                    hash[val][project] += rec[sumField] || 0;
                } else {
                    hash[val][project]++;
                }
    
    
            }
        }
    
        this.logger.log('_buildChart projectKeys, valueKeys', projectKeys, valueKeys);
        var categories = Ext.Array.map(projectKeys, function(p){ return this.projectUtility.getProjectName(p); }, this),
            series = [];
    
        Ext.Object.each(hash, function(val, projectObj){
            var data = [];
            Ext.Array.each(projectKeys, function(p){
                data.push( hash[val][p] || 0 );
            });
            var series_data = {
                name: val,
                data: data
            };
            
            if ( val == 'None' ) {
                series_data.color = '#D3D3D3';
            }
            
            series.push(series_data);
        });
        
        return {
            series: series,
            categories: categories
        };
    },
    
    buildChart: function(records){
        this.logger.log('buildRecords');

        if (records.length === 0){
            this.showAppMessage("No records found for the selected criteria.");
            return;
        }

        var chartData = this.prepareChartData(records);

        var height = Math.max(400,chartData.categories.length * 30);
        if ( this.getChartType() == "Column" ) {
            height = Math.max(400,this.getHeight());
        }
        
        this.add({
            xtype: 'rallychart',
            height: height,
            chartColors: this.chartColors,
            chartData: chartData,
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
                    categories: chartData.categories,
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
    
    getPortfolioItemTypes: function(workspace) {
        var deferred = Ext.create('Deft.Deferred');
                
        var store_config = {
            fetch: ['Name','ElementName','TypePath'],
            model: 'TypeDefinition',
            filters: [
                {
                    property: 'TypePath',
                    operator: 'contains',
                    value: 'PortfolioItem/'
                }
            ],
            sorters: [ {property:'Ordinal', direction: 'ASC'}],
            autoLoad: true,
            listeners: {
                load: function(store, records, successful) {
                    if (successful){
                        deferred.resolve(records);
                    } else {
                        deferred.reject('Failed to load types');
                    }
                }
            }
        };
        
        if ( !Ext.isEmpty(workspace) ) {
            store_config.context = { 
                project:null,
                workspace: workspace._ref ? workspace._ref : workspace.get('_ref')
            };
        }
                
        var store = Ext.create('Rally.data.wsapi.Store', store_config );
                    
        return deferred.promise;
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
