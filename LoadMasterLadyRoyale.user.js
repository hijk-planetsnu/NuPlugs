// ==UserScript==
// @name        LoadMasterLadyRoyale
// @author      hijk
// @description For Planets.nu -- LoadMasterLadyRoyale plugin
// @namespace   LoadMasterLadyRoyale/planets.nu
// @include     http://planets.nu/*
// @include     http://play.planets.nu/*
// @include     http://test.planets.nu/*
// @version     0.02
// @grant       none
// ==/UserScript==
/*- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
Test script to understand plugin elements. Ship controls.

This script is heavily derivative of a Lady Royale loading script written by
Whisperer. Thanks goes to him for the challenge to complete this and also to McNimble for
briefly discussing the project in his PlanetCon 2017 talk (YouTube).

OBJ: Automatically load Lady Royales with clans to fill out cargo space.
       At StarBases, the SB mission is set to "Unload Freighters" so the clans are
       returned to the planet after MCs are generated but before growth is calculated.
       MCs are transfered each turn from ship to planet.

       At planets without SBs, no clans-to-planet reverse transfer is made.
       MCs accumulate on ship.


Code Tasks:
   1. Make option available in dash menu (if not auto_run true).
   2. Find Lady Royales orbiting planets.
   3. Load all open cargo space with clans for the casino (if sufficient clans exist).
   4. If at starbase, unload all MCs and set SB mission to Unload.
   5. If at planet without SB {current: explore possible transfer options}
   6.

v0.02 - in progress: >> utilize ship-to-planet transfer when not at StarBase.
                     >> see note on task #3 below.
v0.01 - start

hijk.180621
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -*/

function wrapper() { // . . . . . . . . . . . wrapper for injection

    var debug = true;
    var plgname = "LoadMasterLadyRoyale";
    var plgversion = 0.01;
    var llr_show = true;       // CLICK menu item to run script during turn
    var llr_run = false;       // auto-run the script with every turn load
    var fuelLLR = 50;          // default fuel load out for new ships
    var useBDM = false;        // option to just use "bdm" friendly code to ALWAYS transfer MCs to planets.
    var lastCall = false;      // under development: loop to utilize planet transfer options w/o SB.
    var cargoloads = ["ammo", "clans", "duranium", "molybdenum", "supplies", "tritanium" ];

//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
var LadyLuck = {
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // LLR handler . . . . . . .
    loadLady : function () {
        for (var i = 0; i < vgap.ships.length; i++) {
            if (vgap.ships[i].ownerid == vgap.player.id && vgap.ships[i].hullid == 42) {
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 1. Load Lady Royales with Gamblers . . . .
                var ship = vgap.ships[i];
                var planet = vgap.planetAt(ship.x, ship.y);
                if (planet !== null) {      // && planet.isbase) { // optional to restrict function to only SBs
                    if (debug) { console.log("   >>> LRR: --- - -- --- --- - - - - -- -- --- --  --- -  - -");}
                    if (debug) { console.log("   >>> LRR: at "+planet.name+" ("+ship.x+","+ship.y+")");}
                    var minClans = 1;
                    if(planet.nativeracename == "Amorphous") {
                        minClans = 6;
                        var happy = planet.colonisthappypoints + planet.colhappychange;
                        if (happy < 70) { minClans += (70 - happy);}
                    }
                    if (debug) { console.log("   >>> planet clans = "+planet.clans+" ; minClans = "+minClans);}
                    if (planet.clans > minClans) {
                        var tClans = 160;
                        for (var j=0; j < cargoloads.length; j++){
                            tClans -= parseInt(ship[cargoloads[j]]);
                        }
                        if (tClans >= (planet.clans - minClans - 1)) {
                            tClans = planet.clans - minClans;
                        }
                        if(tClans > 0) {
                            ship.changed = 1;
                            ship.clans += tClans;
                            planet.changed = 1;
                            planet.clans -= tClans;
                        }
                        if (debug) { console.log("   >>> LRR Clans = "+ship.id+":"+ship.clans+" clans");}

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 2. Transfer MCs if LRR is at a starbase . . . . .
                        if (planet.isbase){
                            if (debug) { console.log("   >>> LRR MCs to StarBase = "+ship.id+":"+ship.megacredits);}
                            planet.megacredits += ship.megacredits
                            planet.changed = 1;
                            ship.megacredits = 0;
                            ship.changed = 1;
                            for (var k=0; k < vgap.starbases.length; k++){
                                if (vgap.starbases[k].planetid == planet.id) {
                                    vgap.starbases[k].mission = 4; // set to "Unload All Freighters"
                                }
                            }
                        } else if (useBDM) {
                            // Option to transfer to any planet using "bdm" friendly code
                            ship.friendlycode = "bdm"
                        }

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 3. LastCall - Set beam transfer for CLANS ship-to-planet . . . . .
                        // The ship.transferclans variable holds a clan number that is separate
                        //    from the ship.clans number and the planet.clans number. So this is
                        //    a transient clan location. However, these clans are not counted
                        //    in LRR revenue . . . I'm not sure there is a way to do this.
                        //    Note that the SUM of all clan vars is checked by nu.js and flagged
                        //    as 'corrupted data' if the sum changes during a turn.
                        if (lastCall && ship.clans > 0 && !(planet.isbase)){
                            if (debug) { console.log("   >>> LRR beam transfer = "+ship.id+":"+ship.clans+" clans");}
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transferclans = ship.clans;
                            ship.clans = 0;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.changed = 1;
                        }
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 4. If this is a new LRR, prep for lauch . . . . .
                        if (ship.neutronium == 0 && planet.isbase){
                            if (debug) { console.log("   >>> NEW LLR = "+ship.id+": ship settings initialized");}
                            ship.warp = ship.engineid;          // set warp speed in case it is a new LRR
                            ship.readystatus = 1;               // set status from 'idle' to 'ready'
                            //ship.mission = 4;                 // set mission to sensor sweep
                            ship.mission = 1;                   // set mission to mine sweep
                            ship.neutronium += fuelLLR;         // add fuel
                            planet.neutronium -= fuelLLR;
                        }

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
                    } // end if planet.clans > minClans
                } // end if LRR is at a planet
            } // end if ship is LLR
        } // end ship list iterate
    },

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    processload: function() {
        if (debug) { console.log("   >>> Load Royale: starting with auto-run = "+llr_run);}
        llr_show = true;
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    loaddashboard: function() {
        if (debug) {console.log("   >>> Load Roayle: dashboard menu");}
        // Make active on dash menu show==true auto_run is false; Function executes on dash-item CLICK.
        if (llr_show && !(llr_run)) {
            vgap.dash.addLeftMenuItem(" Load Royale »", LadyLuck.loadLady, $("#DashboardMenu").find("ul:eq(3)"));
        }
        // if auto_run is true, then no need to display in dash . . . . . . .
        if (llr_run == true){
            LadyLuck.loadLady();
            llr_show = false;
        }
    },
   //- --- --- - - --- --- ---- - - --- --- --- ---- -
}; // end of plugin block
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
//- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -

// register plugin @ NU
vgap.registerPlugin(LadyLuck, plgname);
console.log("Load Master Lady Royale: v" + plgversion + " registered vgap(v"+vgap.version+")" );

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


