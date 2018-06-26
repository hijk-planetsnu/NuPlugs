// ==UserScript==
// @name         LoadMasterFreighters
// @namespace    http://tampermonkey.net/
// @version      0.05
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
       - Expanded to include some other repetitive ship controls.

Code Tasks:
   1. Make option available in dash menu for turns 1-10
   2. Find HW Starbase and generate x,y location.
   3. Find any MDSFs/LDSFs at homeworld.
   4. Unload any cargo
   5. Load for colonize missions
       MDSF defaut: CLANS =  150; SUPPS =  50; MCs = 150
       LDSF defaut: CLANS = 1100; SUPPS = 100; MCs = 300
   6. Ready ship for launch
   7. Stop execution after turn 30 and remove option from dash menu.

v0.05 - Control added for Lizard Class Cruisers - includes +20 mk4 torps
v0.04 - check any ship and if FC is "bdm" from last turn, generate a new semi-random FC
      - check added for planet cargo > than the amount that will be transfered
v0.03 - add some more routine checks for all freighters:
      - if mission == BeamUpFuel (#10), set mission to Sensor Sweep, at any location.
      - filter HW planet on clan population; only transfer @ HW, not other SBs.
v0.02 - add controls for LDSF, not just MDSF

hijk.180624
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -*/

function wrapper() { // . . . . . . . . . . . wrapper for injection
    var debug = true;
    var turnLim = 30;
    var plgname = "LoadMasterFreighters";
    var plgversion = 0.05;
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
                        if (ship.ownerid == pid){
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 2. Any MDSFs here to be loaded . . . ???
                            if (ship.hullid == 16) {
                                if (ship.x == hwx && ship.y == hwy) {
                                    if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                    if (debug) {console.log("   >>> MDSF FOUND  @ ("+hwx+","+hwy+")");}
                                    loadFreighters.unloadSHIP(ship, planet);
                                    loadFreighters.uploadSHIP(ship, planet, mdsfLoads);
                                    loadFreighters.prepSHIP(ship, planet, fuelMDSF);
                                    ship.changed = 1;
                                    planet.changed = 1;
                                }
                            } //close if MDSF
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 3. Any LDSFs here to be loaded . . . ???
                            if (ship.hullid == 17) {
                                if (ship.x == hwx && ship.y == hwy) {
                                    if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                    if (debug) {console.log("   >>> LDSF FOUND  @ ("+hwx+","+hwy+")");}
                                    loadFreighters.unloadSHIP(ship, planet);
                                    loadFreighters.uploadSHIP(ship, planet, ldsfLoads);
                                    loadFreighters.prepSHIP(ship, planet, fuelLDSF);
                                    ship.changed = 1;
                                    planet.changed = 1;
                                }
                            }// close if LDSF

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 4. Any Lizard Class Cruisers . . .
                            if (ship.hullid == 22) {
                                if (ship.x == hwx && ship.y == hwy) {
                                    if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                    if (debug) {console.log("   >>> LCC FOUND  @ ("+hwx+","+hwy+")");}
                                    var loadsLCC = [210, 50, 150];
                                    var torpLCC  = 20;
                                    var fuelLCC  = 250;
                                    loadFreighters.unloadSHIP(ship, planet);
                                    loadFreighters.uploadSHIP(ship, planet, loadsLCC);
                                    ship.warp = 9;                       // set warp speed in case it is a new LDSF
                                    ship.readystatus = 1;                // set status from 'idle' to 'ready'
                                    ship.mission = 9;                    // set mission to Cloak or maybe Hiss==8
                                    ship.changed = 1;
                                    if (ship.neutronium != fuelLCC){
                                        var addFuel = fuelLCC - ship.neutronium;
                                        var transverb = "loading";
                                        if (addFuel < 0) { transverb = "unloading";}
                                        ship.neutronium += addFuel;
                                        planet.neutronium -= addFuel;
                                        planet.changed = 1;
                                        if (debug) {console.log("       >>>     "+transverb+" fuel: "+addFuel+" kt");}
                                    }
                                    if (ship.torpedoid == 6 && ship.ammo < torpLCC){
                                        var addTorps = torpLCC - ship.ammo;
                                        ship.ammo += addTorps;
                                        planet.megacredits -= addTorps * 13;
                                        planet.tritanium -= addTorps;
                                        planet.molybdenum -= addTorps;
                                        planet.duranium -= addTorps;
                                        planet.changed = 1;
                                        if (debug) {console.log("       >>>     loading torps: "+addTorps+" mk4");}
                                    }
                                }
                            }
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 5. Any SHIP in the fleet operations . . .
                            if (ship.friendlycode == "bdm" && ship.ownerid == pid) {
                                ship.friendlycode = loadFreighters.randFC(ship);
                            }
                            if (ship.mission == 10 && ship.ownerid == pid) {
                                ship.mission = 4;   // change BeamUpFuel to SensorSweep
                            }

                        } // end if this ship is yours loop . . . .
                    //- --- --- - - --- --- ---- - - --- --- --- ---- -
                    } //end for ships loop . . .
                } //end if planet SB. . .
            } //end for planet loop . . . .
        } // end if turn < turnLim . . .
    },

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 4. Ship settings to ready for launch . . . . . .
    prepSHIP: function (ship, planet, fuel) {
        ship.warp = 9;                      // set warp speed in case it is a new LDSF
        ship.readystatus = 1;               // set status from 'idle' to 'ready'
        ship.mission = 4;                   // set mission to sensor sweep
        var addFuel = fuel - ship.neutronium;
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
                // *.changed is set in calling function
            }
        }
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 6. Load clans, supplies and MCs . . . .. .
    uploadSHIP: function (ship, planet, xLoads) {
        for (var i = 0; i < colCargo.length; i++) {
            if (planet[colCargo[i]] > xLoads[i]){
                if (debug) {console.log("       >>> uploading: "+xLoads[i]+" of "+colCargo[i]);}
                ship[colCargo[i]] += xLoads[i];
                planet[colCargo[i]] -= xLoads[i];
                // *.changed is set in calling function
            }
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
    randFC: function(ship) {
        var FC = "";
        var maxInt = 26;
        var alpha = [ "a", "b", "c", "d", "E", "f", "G", "h", "i", "j", "K", "L", "m", "N", "O", "P", "q", "r", "S", "t", "U", "v", "W", "x", "Y", "z"];
        for (var i=0; i < 3; i++){
            FC += alpha[(Math.floor(Math.random() * Math.floor(maxInt)))];
        }
        if (debug) { console.log("   >>> FC changed from bdm to "+FC+" on ship "+ship.id+":"+ship.name);}
        return FC;
    }

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




