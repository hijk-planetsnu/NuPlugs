// ==UserScript==
// @name         LoadMasterFreighters
// @namespace    http://tampermonkey.net/
// @version      0.02
// @description  Test Plugin: Load MDSFs and LDSFs at SB during first 30 turns
// @author       Hijk
// @include      http://planets.nu/#/*
// @include      http://planets.nu/*
// @include      http://play.planets.nu/*
// @include      http://test.planets.nu/*
// @grant        none
// ==/UserScript==
/*- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
Test script to understand plugin elements. Ship controls.

OBJ: During first 30 turns, automatically load any MDSFs and LDSFs with clans, supps and MCs.

Code Tasks:
   1. Make option available in dash menu for turns 1-10
   2. Find HW Starbase and generate x,y location.
   3. Find any MDSFs/LDSFs at homeworld.
   4. Unload any cargo
   5. Load for colonize missions
       MDSF defaut: CLANS =  150; SUPPS =  50; MCs = 150
       LDSF defaut: CLANS = 1100; SUPPS = 100; MCs = 300
   6. Ready ship for launch
   7. Remove option from dash menu after turn 20

v0.03 - add some more routine checks for all freighters:
      - if mission == BeamUpFuel (#10), set mission to Sensor Sweep, at any location.
      - filter HW planet on clan population; only transfer @ HW, not other SBs.
v0.02 - add controls for LDSF, not just MDSF

hijk.180621
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -*/

function wrapper() { // . . . . . . . . . . . wrapper for injection
    var debug = true;
    var turnLim = 30;
    var plgname = "LoadMasterFreighters";
    var plgversion = 0.03;
    var mdsf_show = false; // show in side bar menu - click to run
    var mdsf_run = true;   // auto-run every turn
    var allCargo = ["molybdenum","tritanium","duranium","clans","supplies","megacredits"];
    var colCargo = ["clans","supplies","megacredits"];
    var mdsfLoads = [150, 50, 150];
    var ldsfLoads = [1100, 100, 300];
    var fuelLDSF = 250;
    var fuelMDSF = 50;

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
var loadFreighters = {
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 1. Locate Homeworld . . . .
    loadMaster: function (){
        var pid = vgap.player.id;
        if (vgap.settings.turn < turnLim) {
            for (var i = 0; i < vgap.planets.length; i++) {
                var planet = vgap.planets[i];
                if (pid == planet.ownerid && planet.isbase && planet.clans > 10000) {
                    var hwx = planet.x;
                    var hwy = planet.y;
                    if (debug) {console.log("   >>> HW location @ ("+hwx+","+hwy+")");}

                    for (var j = 0; j < vgap.ships.length; j++) {
                        var ship = vgap.ships[j];
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 2. Any MDSFs here to be loaded . . . ???
                        if (ship.hullid == 16 && ship.ownerid == pid) {
                            if (ship.x == hwx && ship.y == hwy) {
                                if (debug) {console.log("   >>> MDSF FOUND  @ ("+hwx+","+hwy+")");}
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, mdsfLoads);
                                loadFreighters.prepSHIP(ship, planet);
                            } else if (ship.mission == 10){
                                ship.mission = 4;
                            }
                        } //close if MDSF
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 3. Any LDSFs here to be loaded . . . ???
                        if (ship.hullid == 17 && ship.ownerid == pid) {
                            if (ship.x == hwx && ship.y == hwy) {
                                if (debug) {console.log("   >>> LDSF FOUND  @ ("+hwx+","+hwy+")");}
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, ldsfLoads);
                                loadFreighters.prepSHIP(ship, planet);
                            } else if (ship.mission == 10) {
                                ship.mission = 4;
                            }
                        }// close if LDSF
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
                    } //end for ships loop . . .
                } //end if planet SB. . .
            } //end for planet loop . . . .
        } // end if turn < turnLim . . .
    },

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 4. Shipping settings to ready for launch . . . . . .
    prepSHIP: function (ship, planet) {
        ship.warp = 9;                      // set warp speed in case it is a new LDSF
        ship.readystatus = 1;               // set status from 'idle' to 'ready'
        ship.mission = 4;                   // set mission to sensor sweep
        var fuelLoadOut = fuelLDSF;         // set fuel var
        if (ship.hullid == 16){ fuelLoadOut = fuelMDSF;}
        var addFuel = fuelLoadOut - ship.neutronium;
        ship.neutronium += addFuel;
        planet.neutronium -= addFuel;
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 5. Remove all cargo on board . . . .
    unloadSHIP: function (ship, planet) {
        for (var i = 0; i < allCargo.length; i++) {
            var load = parseInt(ship[allCargo[i]]);
            if (load > 0) {
                if (debug) {console.log("       >>> unloading: "+load+" kt of "+allCargo[i]);}
                ship[allCargo[i]] -= load;
                planet[allCargo[i]] += load;
                ship.changed = 1;
                planet.changed = 1;
            }
        }
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 6. Load clans, supplies and MCs . . . .. .
    uploadSHIP: function (ship, planet, xLoads) {
        for (var i = 0; i < colCargo.length; i++) {
            if (debug) {console.log("       >>> uploading: "+xLoads[i]+" of "+colCargo[i]);}
            ship[colCargo[i]] += xLoads[i];
            planet[colCargo[i]] -= xLoads[i];
            ship.changed = 1;
            planet.changed = 1;
        }
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    processload: function() {
        if (debug) { console.log("   >>> LoadFreighters: plugin start");}
        mdsf_show = true;
        if (mdsf_run == true){
            loadFreighters.loadMaster(); // auto-run loop
        }
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    loaddashboard: function() {
        if (debug) {console.log("   >>> LoadFreighters: plugin dashboard");}
        // Make active on dash menu ONLY if show==true, turn<10, and note does not already exist . . . .
        //     Function executes on dash-item CLICK.
        if(mdsf_show && vgap.settings.turn < turnLim) {
            vgap.dash.addLeftMenuItem(" Load Clans »", loadFreighters.loadMaster, $("#DashboardMenu").find("ul:eq(3)"));
        }
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
}; // end of plugin block
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -

// register plugin @ NU
vgap.registerPlugin(loadFreighters, plgname);
console.log("Load Freighters: v" + plgversion + " registered vgap(v"+vgap.version+")" );

} //end wrapper for injection . . . . . . . . . . . . . . . . . . . . . .

var script = document.createElement("script");
script.type = "application/javascript";
script.textContent = "(" + wrapper + ")();";

document.body.appendChild(script);

// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --
// - --- -- --- -   -  - - --- --- - - - - - -- - --- - --- - - - -- -----  - -  -    - - -- - ---  --




