// ==UserScript==
// @name         HomeWorldWarpCircles
// @namespace    http://tampermonkey.net/
// @version      0.05
// @description  Test Plugin: Add warp circles to homeworld before Turn #010
// @author       Hijk
// @include      http://planets.nu/#/*
// @include      http://planets.nu/*
// @include      http://play.planets.nu/*
// @include      http://test.planets.nu/*
// @grant        none
// ==/UserScript==
/*- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
Test script to understand plugin elements.

Uses code blocks from Map Draw, Show Notes, and Planetary Management Plugin.
   A grateful thanks goes to the authors of those plugins for the work they
   invested in developing their scripts and tools.

OBJ: At TURN #001 of a new game, create a note using the "MapDraw" format for
     3 warp circles around HomeWorld @ 81 (green), 162 (green), and 243 (yellow) ly.

Given that the note body string for vgaMapMarkUp should look like:
"body": "[{\"active\":true,\"name\":\"HOME\",\"markups\":[{\"type\":\"circle\",\"x\":2363,\"y\":2690,\"r\":81,\"attr\":{\"stroke\":\"#669966\"},\"color\":\"#669966\",\"zmin\":0,\"zmax\":0},{\"type\":\"circle\",\"x\":2363,\"y\":2690,\"r\":161,\"attr\":{\"stroke\":\"#669966\"},\"color\":\"#669966\",\"zmin\":0,\"zmax\":0}]}]",

Then . . .
Code Tasks:
   1. Make option available in dash menu for turns 1-10
   2. Find HW x,y location.
   3. Save map markup object as new note.
   4. Add circles to the Map MarkUp layers.
   5. Remove option from dash menu when completed or turn > 10

NOTE: Function is dependanet upon the vgaMapMarkUp plugin.

v0.05 - Put small circle at center of star map
v0.04 - Use "vgap.addOns.vgapMapMarkUp.overlays" to perform redraw.
v0.03 - Instead of using a hard-coded "note" string, create a real "overlay"
   object defining the warp circles so that the map can be refreshed with the new
   display elements.
v0.02 - The Planetary Management Plugin loads first and generates 5 Notes.
   Thus, the next 'open' note should be id == 6. A check has been added to ensure
   that the note number will be >= 6 so that there is no chance of PMP overwriting
   the warpcircle note data. *** Does not work unless PMP has executed first.
   >> Just use a hard-coded ID value of 6.

hijk.180618
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -*/

function wrapper() { // . . . . . . . . . . . wrapper for injection
    var debug = false;
    var plgname = "HomeWorldWarpCircles";
    var plgversion = 0.05;
    var hwwc_show = true;                            // display option for left menu bar
    var hwwc_autorun = false;                        // auto-run the add Note function on game load
    var drawNoteType = -133919;                      // MapDraw type code used by vgaMapMarkUp
    var newNoteIDnum = 7;                            // default 7
    var wradius = [81, 162, 243]                     // warp distances (ly)
    var wcolor = ["#669966", "#669966", "#ffff00"]   // warp ring colors

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
// START PLUGIN BLOCK . . . . . . . . . . . . . . . .
var drawWarpCircles = {
    addDrawNote: function () {
    //- --- --- - - --- --- ---- - - --- --- ---
    // 1. Get Homeworld planet by finding planet with Starbase within first 10 turns . . . . .
        var pid = vgap.player.id;
        if (vgap.settings.turn < 10) {
            for (var i = 0; i < vgap.planets.length; i++) {
                var planet = vgap.planets[i];
                if (pid == planet.ownerid && planet.isbase) {
                    if (debug) {console.log("   >>> HW location = ("+planet.x+","+planet.y+")");}
    //- --- --- - - --- --- ---- - - --- --- ---
    // 2. Create NOTE object using the MapDraw data structure . . . . . . . . . . .
                    // Create two overlay layers, 0 = HOME and 1 = ENEMY . . . . .
                    var warpz = [{"active":true,"name":"HOME", "markups":[]}, {"active":true,"name":"ENEMY", "markups":[]}];
                    for (var j = 0; j < wradius.length; j++){
                        warpz[0].markups[j] = {"type":"circle","x":planet.x,"y":planet.y,"r":wradius[j],"attr":{"stroke":wcolor[j]},"color":wcolor[j],"zmin":0,"zmax":0}
                    }
                    // Add a reference point in the map center . . . . .
                    var center = {'x': 0.0, 'y': 0.0}
                    for (var k = 0; k < vgap.planets.length; k++) {
                        center.x += vgap.planets[k].x
                        center.y += vgap.planets[k].y
                    }
                    center.x = center.x/vgap.settings.numplanets
                    center.y = center.y/vgap.settings.numplanets
                    if (debug) {console.log("       >>> Map Center = ("+center.x+","+center.y+")");}
                    warpz[1].markups[0] = {"type":"circle","x":center.x,"y":center.y,"r":16,"attr":{"stroke":"#ff0000"},"color":"#ff0000","zmin":0,"zmax":0}
    //- --- --- - - --- --- ---- - - --- --- ---
    // 3. Save as NoteObject and queue for draw on starmap . . . .
                    vgaPlanets.prototype.saveObjectAsNote(newNoteIDnum, drawNoteType, pid, warpz);
                    vgap.addOns.vgapMapMarkUp.overlays.push(warpz[0]);
                    vgap.addOns.vgapMapMarkUp.overlays.push(warpz[1]);
    //- --- --- - - --- --- ---- - - --- --- ---
       }   }   } // end nested loops
    },
    //- --- --- - - --- --- ---- - - --- --- ---
    processload: function() {
        if (debug) { console.log("   >>> drawWarpCircles: plugin start");}
        hwwc_show = true;
    },
    //- --- --- - - --- --- ---- - - --- --- ---
    loaddashboard: function() {
        if (debug) {console.log("   >>> drawWarpCircles: plugin dashboard");}
        if(hwwc_autorun && vgap.settings.turn < 10 && drawWarpCircles.checkNoteNull(drawNoteType)) {
            drawWarpCircles.addDrawNote();
            hwwc_show = false;
        }
        if(hwwc_show && vgap.settings.turn < 10 && drawWarpCircles.checkNoteNull(drawNoteType)) {
            vgap.dash.addLeftMenuItem(" Add HW Warps »", drawWarpCircles.addDrawNote, $("#DashboardMenu").find("ul:eq(3)"));
        }
    },
    //- --- --- - - --- --- ---- - - --- --- ---
    checkNoteNull: function(type) {
        var doesNotExist = 1;
        for (var i = 0; i < vgap.notes.length; i++){
            var note = vgap.notes[i];
            if (note !== null){
                if (debug) {console.log("   >>>     type = >"+note.targettype+"< and id = "+note.id);}
                if (note.body.indexOf("HOME") != -1 && note.targettype == type ) {
                    doesNotExist = 0;  // false, warp circle note already exists
                    if (debug) {console.log("   >>> HW Warp Circles already exists");}
        }   }   } // close all loops
        if (doesNotExist == 1 && debug) {console.log("   >>> HW WarpCircles NOTE does not exist.");}
        return doesNotExist;
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
    //showmap: executed when switching from dashboard to starmap
    showmap: function() {
        vgap.map.drawOverlays();
    },

}; // end of plugin block

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
// Need to access this vgap function to save NOTE data . . . . . . . . . . . .
vgaPlanets.prototype.saveObjectAsNote = function (idnum, type, pid, object) {
    var note = vgap.getNote(idnum, type);
    if (note.body === "") {
        note = vgap.addNote(idnum, type);
        note.changed = 1;
        note.body = JSON.stringify(object);
        //note.body = object;
        note.targettype = type;
        note.color = "";
        note.targetid = 0;
        note.ownerid = pid;
        note.id = idnum;
        vgap.save();
        if (debug) {console.log("   >>> warp circles saved as note . . . . \nNOTEstart>\n"+note.body+"\n<endNote\n");}
    } else {
        if (debug) {console.log("   >>> Note IDNUM Conflict: Could not be saved");}
    }
};

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -

// register plugin @ NU
vgap.registerPlugin(drawWarpCircles, plgname);
console.log("Draw HomeWorldWarpCircles: v" + plgversion + " registered vgap(v"+vgap.version+")" );

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
// noteType = function (name) {
//     // as computed by bigintHash in https://greasyfork.org/en/scripts/6685-planets-nu-plugin-toolkit/code
//     return -parseInt(name.replace(/[_\W]/g, ""), 36) % 2147483648;
//         }
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//                     var overlay = JSON.parse(warpCircles)
//                     if (debug) {console.log("       >>> draw circle = "+overlay);}
//                     for (var j=0; j<3; j++) {
//                         if (debug) {console.log("       >>> draw circle = "+overlay.markups[j]);}
//                         var markup = overlay.markups[j];
//                         vgapMap.prototype.drawScaledCircle(markup.x, markup.y, markup.r, markup.attr, overlay);
//                     }
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//- --- --- - - --- --- ---- - - --- --- ---
// NOTE: not needed when using a hard-coded note position to avoid conflict with PMP ID numbers.
//     newNoteNum: function() {
//         for (var i = 0; i < 20; i++){
//             var note = vgap.notes[i];
//             if (debug) {console.log("   >>> Note ID = "+note.id+" ("+i+")");}
//             if (note.body === ""){ return i+1;}
//         }
//         return 111;
//     },
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//var xycenter = "\"x\":"+planet.x+",\"y\":"+planet.y;
//var warpCircles = "[{\"active\":true,\"name\":\"HOME\",\"markups\":[{\"type\":\"circle\","+xycenter+",\"r\":81,\"attr\":{\"stroke\":\"#669966\"},\"color\":\"#669966\",\"zmin\":0,\"zmax\":0},{\"type\":\"circle\","+xycenter+",\"r\":162,\"attr\":{\"stroke\":\"#669966\"},\"color\":\"#669966\",\"zmin\":0,\"zmax\":0},{\"type\":\"circle\","+xycenter+",\"r\":243,\"attr\":{\"stroke\":\"#ffff00\"},\"color\":\"#ffff00\",\"zmin\":0,\"zmax\":0}]}]";
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//                    var overlays = vgap.addOns.vgapMapMarkUp.overlays;
//                     for (j=0; j<3; j++) {
//                         var mk = warpz[0].markups[j];
//                         vgapMap.prototype.drawScaledCircle(mk.x, mk.y, mk.r, mk.attr, this.overlays);
//                     }
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//                     for (j=0; j<3; j++) {
//                         var mk = warpz[0].markups[j];
//                         if (debug) { console.log("   >>>     Draw warp circle: "+mk.r+" ly");}
//                         vgap.map.drawScaledCircle(mk.x, mk.y, mk.r, mk.attr, vgap.map.ctx);
//                     }
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//     //- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//     //showmap: executed when switching from dashboard to starmap
//     showmap: function() {
//         console.log("My ShowMap: plugin called.");
//         //console.log("Test: length of warpz = "+warpz.length);
//         if (typeof(warpz) !== 'undefined') {
//             drawWarpCircles.draw(warpz[0].markups);
//         }
//     },
//     //- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//     //showmap: executed when switching from dashboard to starmap
//     draw: function(markups) {
//         console.log("My draw: function called.");
//         console.log("\nmarkups>\n"+markups+"\n<end\n");
//         if (typeof(markups) !== 'undefined') {
//             for (var j=0; j<3; j++) {
//                 var mk = markups[j];
//                 if (debug) { console.log("   >>>     xDraw warp circle: "+mk.r+" ly");}
//                 drawWarpCircles.hwScaledCircle(mk.x, mk.y, mk.r, mk.attr, vgap.map.ctx);
//             }
//             if (debug) {console.log("   >>> xStarMap updated with new warp circles.");}
//         }
//     },
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
//     // Draw warp circles . . . . . . . . . . . .
//     hwScaledCircle : function(x, y, radius, attr, paperset) {
//         radius *= vgap.map.zoom;
//         if (radius < 1){ radius = 1; }
//         paperset.strokeStyle = attr.stroke;
//         paperset.lineWidth = 3;
//         paperset.beginPath();
//         paperset.arc(vgap.map.screenX(x), vgap.map.screenY(y), radius, 0, Math.PI * 2, false);
//         paperset.stroke();
//     },
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --



