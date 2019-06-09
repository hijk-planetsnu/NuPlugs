// ==UserScript==
// @name         MapFocus
// @namespace    http://tampermonkey.net/
// @version      0.01
// @description  Define a default point of view position when opening starmap.
// @author       Hijk
// @include      http://planets.nu/*
// @include      https://planets.nu/*
// @include      http://*.planets.nu/*
// @include      https://*.planets.nu/*
// ==/UserScript==
/*- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
OBJECTIVE:  Allow users to define a map focus position as a default for when a
    new turn starmap is opened.

RUN: executes via two options - (a) a left menu item that triggers the code
    function when clicked; or (b) an autorun var that will generate the x,y calc
    and save the note when loaded.

TODO: - add user selected options for centering starmap
      - add a default in case of disaster (HW lost, SB destoyed, ??)

v0.01 - Default view is to center on HW, calculated as the planet with a
          starbase and maximum number of clans.

hijk.180714
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -*/

function wrapper() { // . . . . . . . . . . . wrapper for injection
    var debug = false;
    var plgname = "MapFocus";
    var plgversion = 0.01;
    var mf_show = true;         // display option for left menu bar
    var mf_autorun = true;      // auto-run the load Note function
    var noteType = -1567;       // default
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
// START PLUGIN BLOCK . . . . . . . . . . . . . . . .
var setMapFocus = {
    loadFocus: function() {
        //- --- --- - - --- --- ---- - - --- --- ---
        // If MapFocus note exists, load x,y coordinates . . . . .
        if (setMapFocus.checkNote(noteType)){
            if (debug) {console.log("   >>> MapFocus note was found . . . ");}
            var idnum = setMapFocus.getNoteIDnum(noteType);
            var mfnote = vgaPlanets.prototype.getObjectFromNote(0, noteType)
            vgap.map.centerMap(parseInt(mfnote.x), parseInt(mfnote.y));
        //- --- --- - - --- --- ---- - - --- --- ---
        } else {
        //- --- --- - - --- --- ---- - - --- --- ---
        // Iniatilize the focus point data and save x,y coordinates.
        // Get Homeworld planet by finding planet with Starbase and MAX Clans . . . . .
            var pid = vgap.player.id;
            var maxCols = -1
            var planHW  = -1
            for (var i = 0; i < vgap.planets.length; i++) {
                var planet = vgap.planets[i];
                if (pid == planet.ownerid && planet.isbase) {
                    if (maxCols < planet.clans) {
                        maxCols = planet.clans;
                        planHW  = planet;
            }   }  } // close all loops
            if (debug) {console.log("   >>> Focal Point Location = ("+planHW.x+","+planHW.y+")");}
        // Set NOTE data . . . . . . . . . . .
            var mapfc = {"name":"mapFocusPoint","HW":1,"WT":0,"Sphere":0,"x":planHW.x,"y":planHW.y};
            var IDnum = setMapFocus.getNoteIDnum();
            vgaPlanets.prototype.saveObjectAsNote(IDnum, noteType, mapfc);
            vgap.map.centerMap(planHW.x, planHW.y);
       } // close else if note does not exist . . . . . . . .
    },
    //- --- --- - - --- --- ---- - - --- --- ---
    processload: function() {
        mf_show = true;
    },
    //- --- --- - - --- --- ---- - - --- --- ---
    loaddashboard: function() {
        if (mf_autorun) {
            setMapFocus.loadFocus();
            mf_show = false;
        }
        if (mf_show) {
            vgap.dash.addLeftMenuItem(" Map Focus »", setMapFocus.loadFocus, $("#DashboardMenu").find("ul:eq(3)"));
        }
    },
    //- --- --- - - --- --- ---- - - --- --- ---
    checkNote: function(type) {
        var doesExist = 0;
        for (var i = 0; i < vgap.notes.length; i++){
            var note = vgap.notes[i];
            if (note !== null) {
                if (note.targettype == type && note.body !== ""){
                    doesExist = 1;            // true, MapFocus note already exists
                    break;
        }   }   }// close all loops
        if (doesExist == 0 && debug) { console.log("   >>> MapFocus note does NOT exist."); }
        return doesExist;
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
    getNoteIDnum: function(type) {
        var noteIDnum = 0;
        for (var i = 0; i < vgap.notes.length; i++){
            var note = vgap.notes[i];
            if (note.targettype == type) {
                noteIDnum = note.id;
                break;
            }
            if (note.id == 0) {
                noteIDnum = i+1;
                break;
        }   } // close loops
        if (debug) {console.log("   >>>     mapfocus note id# = "+noteIDnum);}
        return noteIDnum;
    },

}; // end of plugin block
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
// vgap function to save NOTE data . . . . . . . . . . . .
vgaPlanets.prototype.saveObjectAsNote = function (idnum, type, object) {
    var note = vgap.getNote(idnum, type);
        if (note == null)
            note = vgap.addNote(idnum, type);
        note.changed = 1;
        note.body = JSON.stringify(object);
        note.targettype = type;
        note.color = "";
        note.targetid = 0;
        note.ownerid = vgap.player.id;
        note.id = idnum;
        vgap.save();
        if (debug) {console.log("   >>> MapFocus saved as note . . . . \nNOTEstart>\n"+note.body+"\n<endNote\n");}
};
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
// vgap function to load NOTE data . . . . . . . . . . . .
vgaPlanets.prototype.getObjectFromNote = function (targetid, type) {
    var note = vgap.getNote(targetid, type);
    if (note.body != "")
        return JSON.parse(note.body);
    else
        return null;
};

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -

// register plugin @ NU
vgap.registerPlugin(setMapFocus, plgname);
console.log("Starmap MapFocus: v" + plgversion + " registered vgap(v"+vgap.version+")" );

} //end wrapper for injection . . . . . . . . . . . . . . . . . . . . . .
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -

var script = document.createElement("script");
script.type = "application/javascript";
script.textContent = "(" + wrapper + ")();";
document.body.appendChild(script);


// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// . . . . . .  B O N E   Y A R D  . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//         // as computed by bigintHash in https://greasyfork.org/en/scripts/6685-planets-nu-plugin-toolkit/code
//         noteTypeNum = -parseInt(plgname.replace(/[_\W]/g, ""), 36) % 2147483648;
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --



