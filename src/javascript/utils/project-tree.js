Ext.define('CA.technicalservices.utils.ProjectUtilities',{

    fetch: ['ObjectID','Name','Parent'],
    mixins: {
        observable: 'Ext.util.Observable'
    },
    constructor: function(config){
        this.mixins.observable.constructor.call(this, config);

        var fetch = Ext.Array.merge(this.fetch, config && config.fetch || []);
        this.projectParentHash = {};
        console.log('fetch', fetch);
        Ext.create('Rally.data.wsapi.Store',{
            model: 'Project',
            fetch: ['ObjectID','Name','Parent'],
            limit: Infinity,
            context: {project: null},
            compact: false
        }).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    this._buildProjectParentHash(records);
                } else {
                    this.fireEvent('onerror', "Error fetching projects: " + operation.error && operation.error.errors.join(','));
                }
            },
            scope: this
        });
    },
    _buildProjectParentHash: function(records){

        var projectHash = {};
        Ext.Array.each(records, function(r){
            projectHash[r.get('ObjectID')] = r.getData();
        });
        this.projectHash= projectHash;
        this.fireEvent('ready');
    },
    getProjectAncestor: function(projectID, projectLevel){
        var parent = this.projectHash[projectID].Parent && this.projectHash[projectID].Parent.ObjectID || null,
            ancestry = this.projectHash[projectID] && this.projectHash[projectID].ancestors;

        if (!ancestry){
            ancestry = [projectID];
            do {
                ancestry.unshift(parent);
                parent = this.projectHash[parent] &&
                    this.projectHash[parent].Parent &&
                    this.projectHash[parent].Parent.ObjectID || null;

            } while (parent);

            this.projectHash[projectID].ancestors = ancestry;
        }
        if (ancestry.length >= projectLevel){
            return ancestry[projectLevel - 1];
        }
        return -1;
    },
    getProjectName: function(projectID){
        return this.projectHash[projectID] &&  this.projectHash[projectID].Name || "Unknown";
    }
});