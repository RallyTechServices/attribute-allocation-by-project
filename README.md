#Attribute Allocation by Project

###Overview
This app shows the percentage allocation of an artifact attribute across a set of projects for a particular query.  

In this app, the artifacts are bucketed into the project at the configured project level (relative to the current project) whose hierarchy they are in.  

![ScreenShot](/images/attribute-allocation-by-project.png)

For example given the following project structure:

![ScreenShot](/images/project-hierarchy.png)

If the project scope is "Online Store, Inc" and app is configured for Project Level = 1, the X-Axis will contain the following project buckets (also seen in the above screenshot):
#####Architecture
#####Consumer Program / ART
#####Reseller Program / ART

*Note that these are projects that are 1 level down from the current project*      
     
#####Take the following features and their respective projects:

* Feature 1 (Agile Team 1)
* Feature 2 (Agile Team 2)
* Feature 3 (Consumer Program / ART)
* Feature 4 (Architecture Team)
* Feature 5 (Rally Essentials)
* Feature 6 (Online Store, Inc)

#####The features will be bucketed as follows:

#####Architecture
 * Feature 4 
 
#####Consumer Program / ART
 * Feature 1
 * Feature 2
 * Feature 3 

 * Feature 5 will not be included in the chart data because it resides in a project that is outside the scope of the currently selected project.  
 * Feature 6 will not be included because it resides at the current project level and cannot be bucketed.

  
###Notes

If an artifact has a null attribute value, then it will inherit the value from it's parent. 
  
Artifacts with Null values are included in the chart.  To calculate datasets for only artifacts with a populated attribute field, add a query to the app settings.  For example, if the attribute
field is "Investment Category" and we want to exclude artifacts with an investment category of "none" (the equivalent to null for InvestmentCategory field), then add the following query:

((InvestmentCategory != "None") OR (Parent.InvestmentCategory != "None"))

Note that the Parent is added to the query as an OR so that we don't exclude features that inherit the investment category from their parents.
  
###App Settings:
######Project Level
  The relative project level to bucket artifacts into.  
  
######Artifact Type
  The objects that represent the data in the chart.  The choice of an artifact type will determine how 
  the data is bucketed by project and by artifact field selection.  The app will still go and get features
  no matter what PI type is chosen.  If the feature has a value in the sum field, that value will be applied
  to the project/grouping that belongs to the parent (initiative) record unless feature is the chosen Artifact
  Type.
  
######Artifact Field
  The field on the artifact type object that represents the attribute.  The values for this field will be the series.  
  
######Sum Field
  The field to sum to calculate the percentage.  To  total the feature count, select "Feature Count".  Other options are Preliminary and Refined Estimates, and Leaf Story count/Estimate fields.  
  
######Show Project Classification
  Show the rendered project classification on the chart.  Project classification is a custom field on the Project Object. 
  
######Project Classification field
  The field to determine a project's classification 
  
######Chart Type
  The chart can be configured as a Bar chart or a column chart.  A bar chart is recommended if there are more than 8 projects.
  
######Chart Title
  The title to be displayed at the top of the chart.  
  
######Query
  Query to use to limit the dataset for the artifacts to be evaluated.  
  
### Notes
 * If an artifact exists in a project above the configured project level, then that artifact will NOT be included in the dataset or the chart.  
 * Only 4 colors are configured.  If there are more than 4 values, additional colors may need to be added in the chartColors configuration at the top of the app.js file.      

## Development Notes

* There ARE two spec files for fast tests about extracting information from the records (grouping category and value). 
Be sure to update these if you're messing with the functions in calculator.js.  Run with grunt test-fast.  (Also
grunt watch will run these tests if the files change).

* Since the goal for initiatives is to get the information from features but bucket based on the initiative bucket,
when initiative is called, we have to do two calls to the server to get data.  

### First Load

If you've just downloaded this from github and you want to do development, 
you're going to need to have these installed:

 * node.js
 * grunt-cli
 * grunt-init
 
Since you're getting this from github, we assume you have the command line
version of git also installed.  If not, go get git.

If you have those three installed, just type this in the root directory here
to get set up to develop:

  npm install

### Structure

  * src/javascript:  All the JS files saved here will be compiled into the 
  target html file
  * src/style: All of the stylesheets saved here will be compiled into the 
  target html file
  * test/fast: Fast jasmine tests go here.  There should also be a helper 
  file that is loaded first for creating mocks and doing other shortcuts
  (fastHelper.js) **Tests should be in a file named <something>-spec.js**
  * test/slow: Slow jasmine tests go here.  There should also be a helper
  file that is loaded first for creating mocks and doing other shortcuts 
  (slowHelper.js) **Tests should be in a file named <something>-spec.js**
  * templates: This is where templates that are used to create the production
  and debug html files live.  The advantage of using these templates is that
  you can configure the behavior of the html around the JS.
  * config.json: This file contains the configuration settings necessary to
  create the debug and production html files.  
  * package.json: This file lists the dependencies for grunt
  * auth.json: This file should NOT be checked in.  Create this to create a
  debug version of the app, to run the slow test specs and/or to use grunt to
  install the app in your test environment.  It should look like:
    {
        "username":"you@company.com",
        "password":"secret",
        "server": "https://rally1.rallydev.com"
    }
  
### Usage of the grunt file
####Tasks
    
##### grunt debug

Use grunt debug to create the debug html file.  You only need to run this when you have added new files to
the src directories.

##### grunt build

Use grunt build to create the production html file.  We still have to copy the html file to a panel to test.

##### grunt test-fast

Use grunt test-fast to run the Jasmine tests in the fast directory.  Typically, the tests in the fast 
directory are more pure unit tests and do not need to connect to Rally.

##### grunt test-slow

Use grunt test-slow to run the Jasmine tests in the slow directory.  Typically, the tests in the slow
directory are more like integration tests in that they require connecting to Rally and interacting with
data.

##### grunt deploy

Use grunt deploy to build the deploy file and then install it into a new page/app in Rally.  It will create the page on the Home tab and then add a custom html app to the page.  The page will be named using the "name" key in the config.json file (with an asterisk prepended).

To use this task, you must create an auth.json file that contains the following keys:
{
    "username": "fred@fred.com",
    "password": "fredfredfred",
    "server": "https://us1.rallydev.com"
}

(Use your username and password, of course.)  NOTE: not sure why yet, but this task does not work against the demo environments.  Also, .gitignore is configured so that this file does not get committed.  Do not commit this file with a password in it!

When the first install is complete, the script will add the ObjectIDs of the page and panel to the auth.json file, so that it looks like this:

{
    "username": "fred@fred.com",
    "password": "fredfredfred",
    "server": "https://us1.rallydev.com",
    "pageOid": "52339218186",
    "panelOid": 52339218188
}

On subsequent installs, the script will write to this same page/app. Remove the
pageOid and panelOid lines to install in a new place.  CAUTION:  Currently, error checking is not enabled, so it will fail silently.

##### grunt watch

Run this to watch files (js and css).  When a file is saved, the task will automatically build and deploy as shown in the deploy section above.

