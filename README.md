#Attribute Allocation by Project

###Overview
This app shows the percentage allocation of an artifact attribute across a set of projects for a particular query.  

In this app, the artifacts are bucketed into the project at the configured project level whose hierarchy they are in.  

![ScreenShot](/images/attribute-allocation-by-project.png)

For example given the following project structure:

![ScreenShot](/images/project-hierarchy.png)

If the app is configured for Project Level = 2, the X-Axis will contain the following project buckets (also seen in the above screenshot):
     * Architecture
     * Consumer Program / ART
     * Reseller Program / ART
     * Rally Essentials
     * Rally Tools 
     
#####Take the following features and their respective projects:
Feature 1 (Agile Team 1)
Feature 2 (Agile Team 2)
Feature 3 (Consumer Program / ART)
Feature 4 (Architecture Team)
Feature 5 (Rally Essentials)
Feature 6 (Online Store, Inc)

#####The features will be bucketed as follows:

######Architecture
 * Feature 4 
 
######Consumer Program / ART
 * Feature 1
 * Feature 2
 * Feature 3 

######Rally Tool Training 
 * Feature 5 

*Feature 6 will not be included in the chart data becuase it resides in a project that is a Project Level 1 project and the chart is only showing features bucketed by Project Level 2*  
 
  
###App Settings:
  ######Project Level
  The project level to bucket artifacts into.  
  
  ######Artifact Type
  the objects that represent the data in the chart.
  
  ######Artifact Field
  The field on the artifact type object that represents the attribute.  The values for this field will be the series.  
  
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
  If an artifact exists in a project above the configured project level, then that artifact will NOT be included in the dataset or the chart.  
  Only 4 colors are configured.  If there are more than 4 values, additional colors may need to be added in the chartColors configuration at the top of hte app.js file.      
      
      

## Development Notes

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

