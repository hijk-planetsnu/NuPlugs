// ==UserScript==
// @name         LoadMasterFreighters
// @namespace    http://tampermonkey.net/
// @version      0.09
// @description  Test Plugin: Load MDSFs and LDSFs at SB during first 30 turns
// @author       Hijk
// @include      http://planets.nu/*
// @include      https://planets.nu/*
// @include      http://*.planets.nu/*
// @include      https://*.planets.nu/*
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
       MDSF defaut: CLANS =  144; SUPPS = 56; MCs = 300
       LDSF defaut: CLANS = 1144; SUPPS = 56; MCs = 300
   6. Ready ship for launch
   7. Stop execution after turn 30 and remove option from dash menu.

v0.09 - Added Bird fleet ships; added mass checks prior to torp building loops
v0.08 - More extensive PL21 control module
v0.07 - fix logic error: do not execute every time the dashboard changes to starmap.
           Use readystatus as a loop filter. Once a ship is marked ready, do not change.
v0.06 - Control added for HYP ship after jump
v0.05 - Control added for Lizard Class Cruisers - includes +20 mk4 torps
v0.04 - check any ship and if FC is "bdm" from last turn, generate a new semi-random FC
      - check added for planet cargo > than the amount that will be transfered
v0.03 - add some more routine checks for all freighters:
      - if mission == BeamUpFuel (#10), set mission to Sensor Sweep, at any location.
      - filter HW planet on clan population; only transfer @ HW, not other SBs.
v0.02 - add controls for LDSF, not just MDSF

hijk.190316
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -
- --- --- - - --- --- ---- - - --- --- --- ---- - - - --- - -- -- ---- - - --- -*/

function wrapper() { // . . . . . . . . . . . wrapper for injection
    var debug     = false;
    var turnLim   = 30;
    var plgname   = "LoadMasterFreighters";
    var plgversion = 0.09;
    var mdsf_show = false;  // show in side bar menu - click to run
    var mdsf_run  = true;   // auto-run every turn
    var allCargo  = ["molybdenum","tritanium","duranium","clans","supplies","megacredits"];
    var colCargo  = ["clans","supplies","megacredits"];
    var mdsfLoads = [100,   100, 300];   // first wave colonize with factories
    var ldsfLoads = [1000,  200, 300];   // colony build
    var fcode     = 'xol';               // fcode trigger for script functions;
    var fuelLDSF  = 200;
    var fuelMDSF  = 60;
    var addFuel   = 0;
    var transverb = 0;

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
                        if (ship.ownerid == pid && ship.x == hwx && ship.y == hwy && ship.readystatus == 0){
                            // -- --- - -- -- --- ---- - - - --
                            // set FC of any new ship built to the trigercode for script control functions . . . .
                            if (ship.neutronium == 0){ ship.friendlycode = fcode;}
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 2. Any MDSFs here to be loaded . . . ???
                            if (ship.hullid == 16 && ( ship.friendlycode == fcode || vgap.settings.turn == 1)) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> MDSF FOUND  @ ("+hwx+","+hwy+")");}
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, mdsfLoads);
                                loadFreighters.prepSHIP(ship, planet, fuelMDSF);
                                ship.friendlycode = fcode;
                                ship.changed = 1;
                                planet.changed = 1;
                            } //close if MDSF
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 3. Any LDSFs here to be loaded . . . ???
                            if (ship.hullid == 17 && ship.friendlycode == fcode) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> LDSF FOUND  @ ("+hwx+","+hwy+")");}
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, ldsfLoads);
                                loadFreighters.prepSHIP(ship, planet, fuelLDSF);
                                ship.changed = 1;
                                planet.changed = 1;
                            }// close if LDSF

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 4. Any Lizard Class Cruisers . . .
                            if (ship.hullid == 22 && ship.friendlycode == fcode) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> LCC FOUND  @ ("+hwx+","+hwy+")");}
                                var loadsLCC = [203, 67, 350];
                                var torpLCC  = 10;
                                var fuelLCC  = 250;
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, loadsLCC);
                                ship.warp = 9;                       // set warp speed in case it is a new LDSF
                                ship.readystatus = 0;                // set status from 'idle' to 'ready'
                                ship.mission = 9;                    // set mission to Cloak or maybe Hiss==8
                                ship.changed = 1;
                                if (ship.neutronium != fuelLCC){
                                    addFuel = fuelLCC - ship.neutronium && planet.neutronium > fuelLCC;
                                    transverb = "loading";
                                    if (addFuel < 0) { transverb = "unloading";}
                                    ship.neutronium += addFuel;
                                    planet.neutronium -= addFuel;
                                    planet.changed = 1;
                                    if (debug) {console.log("       >>>     "+transverb+" fuel: "+addFuel+" kt");}
                                }
                                if (ship.torpedoid == 6 && ship.ammo < torpLCC){
                                    var addTorp22 = torpLCC - ship.ammo;
                                    if ( (planet.megacredits > (addTorp22 * 13)) && planet.tritanium > addTorp22 && planet.molybdenum > addTorp22 && planet.duranium > addTorp22){
                                        ship.ammo += addTorp22;
                                        planet.megacredits -= addTorp22 * 13;
                                        planet.tritanium -= addTorp22;
                                        planet.molybdenum -= addTorp22;
                                        planet.duranium -= addTorp22;
                                        planet.changed = 1;
                                        if (debug) {console.log("       >>>     loading torps: "+addTorps+" mk4");}
                                    }
                                }
                            } // end LCC
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 5. Evil Empire: Any PL21 or MigScout here to be loaded . . . ???
                            if ( (ship.hullid == 77 || ship.hullid == 73) && ship.friendlycode == fcode) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> PL21 FOUND  @ HW-SB ("+hwx+","+hwy+")");}
                                var loadsPL21 = [20, 0, 0];
                                var fuelPL21  = 50;
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, loadsPL21);
                                ship.warp = ship.engineid;           // set warp speed in case it is a new LDSF
                                ship.readystatus = 0;                // set status from 'idle' to 'ready'
                                ship.mission = 8;                    // set mission to DarkSense
                                ship.changed = 1;
                                if (ship.neutronium != fuelPL21 && planet.neutronium > fuelPL21){
                                    addFuel = fuelPL21 - ship.neutronium;
                                    transverb = "loading";
                                    if (addFuel < 0) { transverb = "unloading";}
                                    ship.neutronium += addFuel;
                                    planet.neutronium -= addFuel;
                                    planet.changed = 1;
                                    if (debug) {console.log("       >>>     "+transverb+" fuel: "+addFuel+" kt");}
                                }
                            }// close if PL21
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 6. Empire of the Birds: Any Swift Heart . . . ???
                            if (ship.hullid == 27 && ship.friendlycode == fcode) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> Swiftie FOUND  @ HW-SB ("+hwx+","+hwy+")");}
                                var loadsSwift = [15, 5, 20];
                                var fuelSwift  = 50;
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, loadsSwift);
                                ship.warp = 9;                       // set warp speed in case it is a new LDSF
                                ship.readystatus = 0;                // set status from 'idle' to 'ready'
                                ship.mission = 4;                    // set mission to Sensor Sweep
                                ship.changed = 1;
                                if (ship.neutronium != fuelSwift && planet.neutronium > fuelSwift){
                                    addFuel = fuelSwift - ship.neutronium;
                                    transverb = "loading";
                                    if (addFuel < 0) { transverb = "unloading";}
                                    ship.neutronium += addFuel;
                                    planet.neutronium -= addFuel;
                                    planet.changed = 1;
                                    if (debug) {console.log("       >>>     "+transverb+" fuel: "+addFuel+" kt");}
                                }
                            }// close if Swift Heart
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 7. Any Resolute Battle Ships . . .
                            if (ship.hullid == 31 && ship.friendlycode == fcode) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> Ressie FOUND  @ ("+hwx+","+hwy+")");}
                                var loadsRessie = [215, 30, 30];
                                var torpRessie  = 35;
                                var fuelRessie  = 250;
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, loadsRessie);
                                ship.warp = 9;                       // set warp speed in case it is a new LDSF
                                ship.readystatus = 0;                // set status from 'idle' to 'ready'
                                ship.mission = 9;                    // set mission to Cloak or maybe Hiss==8
                                ship.changed = 1;
                                if (ship.neutronium != fuelRessie && planet.neutronium > fuelRessie){
                                    addFuel = fuelRessie - ship.neutronium;
                                    transverb = "loading";
                                    if (addFuel < 0) { transverb = "unloading";}
                                    ship.neutronium += addFuel;
                                    planet.neutronium -= addFuel;
                                    planet.changed = 1;
                                    if (debug) {console.log("       >>>     "+transverb+" fuel: "+addFuel+" kt");}
                                }
                                if (ship.torpedoid == 6 && ship.ammo < torpRessie){
                                    var addTorp31 = torpRessie - ship.ammo;
                                    if ( (planet.megacredits > (addTorp31 * 13)) && planet.tritanium > addTorp31 && planet.molybdenum > addTorp31 && planet.duranium > addTorp31){
                                        ship.ammo += addTorp31;
                                        planet.megacredits -= addTorp31 * 13;
                                        planet.tritanium -= addTorp31;
                                        planet.molybdenum -= addTorp31;
                                        planet.duranium -= addTorp31;
                                        planet.changed = 1;
                                        if (debug) {console.log("       >>>     loading torps: "+addTorp31+" mk4");}
                                    }
                                }
                            } // end Ressie
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 8. Any Fearless Wing Cruisers . . .
                            if (ship.hullid == 28 && ship.friendlycode == fcode) {
                                if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
                                if (debug) {console.log("   >>> Fearless FOUND  @ ("+hwx+","+hwy+")");}
                                var loadsFear = [180, 50, 150];
                                var torpFear  = 10;
                                var fuelFear  = 150;
                                loadFreighters.unloadSHIP(ship, planet);
                                loadFreighters.uploadSHIP(ship, planet, loadsFear);
                                ship.warp = 9;                       // set warp speed in case it is a new LDSF
                                ship.readystatus = 0;                // set status from 'idle' to 'ready'
                                ship.mission = 9;                    // set mission to Cloak or maybe Hiss==8
                                ship.changed = 1;
                                if (ship.neutronium != fuelFear && planet.neutronium > fuelFear){
                                    addFuel = fuelFear - ship.neutronium;
                                    transverb = "loading";
                                    if (addFuel < 0) { transverb = "unloading";}
                                    ship.neutronium += addFuel;
                                    planet.neutronium -= addFuel;
                                    planet.changed = 1;
                                    if (debug) {console.log("       >>>     "+transverb+" fuel: "+addFuel+" kt");}
                                }
                                if (ship.torpedoid == 6 && ship.ammo < torpFear){
                                    var addTorp28 = torpFear - ship.ammo;
                                    if ( (planet.megacredits > (addTorp28 * 13)) && planet.tritanium > addTorp28 && planet.molybdenum > addTorp28 && planet.duranium > addTorp28){
                                        ship.ammo += addTorp28;
                                        planet.megacredits -= addTorp28 * 13;
                                        planet.tritanium -= addTorp28;
                                        planet.molybdenum -= addTorp28;
                                        planet.duranium -= addTorp28;
                                        planet.changed = 1;
                                        if (debug) {console.log("       >>>     loading torps: "+addTorp28+" mk4");}
                                    }
                                }
                            } // end Fearless
     //- --- --- - - --- --- ---- - - --- --- --- ---- -
                        } // end if this ship is at your HW starbase . . . .
                    } //end for ships @ SB loop . . .
                } //end if planet is your HomeWorld . . .
            } //end for planet loop . . . .
            // --- --- --- - -- ----- - - --- --- - - -- -- - --- -- -- ---- -- --  -- -
            // Execute other routine ship controls here when the plugin is run manually via dash-menu CLICK.
            loadFreighters.shipControl(); // auto-run loop
            // --- --- --- - -- ----- - - --- --- - - -- -- - --- -- -- ---- -- --  -- -
        } // end if turn < turnLim . . .
    },

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 6. Standard Ship OPS for ALL turns at any location . . . . . .
    //    Always called every turn . . . . . . .
    shipControl: function () {
        if (debug) {console.log("   >>> --- --- - - - -   - -- ---- - - - - -- - -  -");}
        if (debug) {console.log("   >>> Scanning All Ships . . . . . ");}
        for (var j = 0; j < vgap.ships.length; j++) {
            var ship = vgap.ships[j];
            var pid = vgap.player.id;
            if (ship.ownerid == pid  && ship.readystatus == 0){
            // Any ship that was set to BeamDownMoney on previous turn . . . reset FC
                if (ship.friendlycode == "bdm") {
                    ship.friendlycode = loadFreighters.randFC(ship);
                }
            // Any ship that was set to BeamUpFuel on previous turn . . . reset mission
                if (ship.mission == 10) {
                    ship.mission = 4;   // change BeamUpFuel to SensorSweep
                    // Dark Sense Mission for Evil Empire
                    if (vgap.player.raceid == 8){ ship.mission = 8 }
                }
            // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
                // Any MDSF . . . . . . . . . . .
                if (ship.hullid == 16) {
                    // If planet is unowned and has no Amorphs => colonize and react . . . . . . . . . .
                    if (debug) {console.log("        >>> check loaction MDSF: ID#"+ship.id);}
                    var planet = vgap.planetAt(ship.x,ship.y)
                    if (planet === undefined){ if (debug)      {console.log("            >>> no planet at ("+ship.x+","+ship.y+")");}}
                    if (planet !== undefined){
                        if (planet.ownerid == pid) {if (debug) {console.log("            >>> orbiting OWN planet = id:"+planet.id);}}
                        if (planet.ownerid == 0 && planet.nativetype !== 5 && ship.transferclans == 0 && ship.clans > 0){
                            ship.mission = 11   // beam up duranium when exploring new planets
                            if (ship.supplies > 9 && ship.megacredits > 29 && ship.clans > 9){
                                var dropClans = 10
                                var dropSups  = 10
                                var dropMCs   = 30
                                ship.transferclans = dropClans;     // beam transfer 10 clan
                                ship.clans -= dropClans;
                                ship.transfersupplies = dropSups;
                                ship.supplies -= dropSups;
                                ship.transfermegacredits = dropMCs;
                                ship.megacredits -= dropMCs;
                                ship.target = planet;
                                ship.targetx = ship.x;
                                ship.targety = ship.y;
                                ship.transfertargetid = planet.id;
                                ship.transfertargettype = 1;
                                ship.changed = 1
                                if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                            }
                            else {
                            ship.transferclans = 1;     // beam transfer 1 clan
                            ship.clans -= 1;
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.changed = 1
                            if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                            }
                        }
                    }
                }//  end MDSF ship processing loop . . . . . . . . . . .
            // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
                // Any PL21 HYP ships . . . . . . . . . . .
                if (ship.hullid == 77) {
                    // Any HYP ship that just jumped should be reset . . .
                    if (ship.friendlycode.match(/HYP/i)){
                        ship.warp = ship.engineid;
                        ship.friendlycode = loadFreighters.randFC(ship);
                        ship.mission = 8;
                    }
                    if (ship.mission != 8){
                        ship.mission = 8;    // set mission to Dark Sense
                    }
                    // If planet is unowned and has no Amorphs => colonize and react . . . . . . . . . .
                    if (debug) {console.log("        >>> check loaction MDSF: ID#"+ship.id);}
                    planet = vgap.planetAt(ship.x,ship.y)
                    if (planet === undefined){ if (debug)      {console.log("            >>> no planet at ("+ship.x+","+ship.y+")");}}
                    if (planet !== undefined){
                        if (planet.ownerid == pid) {if (debug) {console.log("            >>> orbiting OWN planet = id:"+planet.id);}}
                        if (planet.ownerid == 0 && planet.nativetype !== 5 && ship.transferclans == 0 && ship.clans > 0){
                            ship.transferclans = 1;     // beam transfer 1 clan
                            ship.clans -= 1;
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.mission = 10;   // set mission to BeamUpFuel
                            ship.changed = 1
                            if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                        }
                    }
                }//  end PL21 ship processing loop . . . . . . . . . . .
            // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
            // Any MigScout ships . . . . . . . . . . .
                if (ship.hullid == 73) {
                    // Any HYP ship that just jumped should be reset . . .
                    if (ship.mission != 8){
                        ship.mission = 8;    // set mission to Dark Sense
                    }
                    // If planet is unowned and has no Amorphs => colonize and react . . . . . . . . . .
                    if (debug) {console.log("        >>> check loaction MigScout: ID#"+ship.id);}
                    planet = vgap.planetAt(ship.x,ship.y)
                    if (planet === undefined){ if (debug)      {console.log("            >>> no planet at ("+ship.x+","+ship.y+")");}}
                    if (planet !== undefined){
                        if (planet.ownerid == pid) {if (debug) {console.log("            >>> orbiting OWN planet = id:"+planet.id);}}
                        if (planet.ownerid == 0 && planet.nativetype !== 5 && ship.transferclans == 0 && ship.clans > 0){
                            ship.transferclans = 1;     // beam transfer 1 clan
                            ship.clans -= 1;
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.changed = 1
                            if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                        }
                    }
                } //  end MigScout ship processing loop . . . . . . . . . . .
            // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
            // Any Swift Heart ships . . . . . . . . . . .
                if (ship.hullid == 27) {
                    // If planet is unowned and has no Amorphs => colonize and react . . . . . . . . . .
                    if (debug) {console.log("        >>> check loaction Swiftie: ID#"+ship.id);}
                    planet = vgap.planetAt(ship.x,ship.y)
                    if (planet === undefined){ if (debug)      {console.log("            >>> no planet at ("+ship.x+","+ship.y+")");}}
                    if (planet !== undefined){
                        if (planet.ownerid == pid) {if (debug) {console.log("            >>> orbiting OWN planet = id:"+planet.id);}}
                        if (planet.ownerid == 0 && planet.nativetype !== 5 && ship.transferclans == 0 && ship.clans > 0){
                            ship.transferclans = 1;     // beam transfer 1 clan
                            ship.clans -= 1;
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.changed = 1
                            if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                        }
                    }
                } //  end Swift Heart ship processing loop . . . . . . . . . . .
            // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
            // Any Fearless . . . . . . . . . . .
                if (ship.hullid == 28) {
                    // If planet is unowned and has no Amorphs => colonize and react . . . . . . . . . .
                    if (debug) {console.log("        >>> check loaction Fear/Ressie: ID#"+ship.id);}
                    planet = vgap.planetAt(ship.x,ship.y)
                    if (planet === undefined){ if (debug)      {console.log("            >>> no planet at ("+ship.x+","+ship.y+")");}}
                    if (planet !== undefined){
                        if (planet.ownerid == pid) {if (debug) {console.log("            >>> orbiting OWN planet = id:"+planet.id);}}
                        if (planet.ownerid == 0 && planet.nativetype !== 5 && ship.transferclans == 0 && ship.clans > 0){
                            ship.mission = 11   // default mission beam up duranium . . . . . .
                            if (ship.supplies > 5 && ship.megacredits > 14 && ship.clans > 9){
                                dropClans = 10
                                dropSups  = 5
                                dropMCs   = 15
                                ship.transferclans = dropClans;     // beam transfer 10 clan
                                ship.clans -= dropClans;
                                ship.transfersupplies = dropSups;
                                ship.supplies -= dropSups;
                                ship.transfermegacredits = dropMCs;
                                ship.megacredits -= dropMCs;
                                ship.target = planet;
                                ship.targetx = ship.x;
                                ship.targety = ship.y;
                                ship.transfertargetid = planet.id;
                                ship.transfertargettype = 1;
                                ship.changed = 1
                                if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                            }
                            else  {
                            ship.transferclans = 1;     // beam transfer 1 clan
                            ship.clans -= 1;
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.changed = 1
                            if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                            }
                        }
                    }
                }//  end Fearless ship processing loop . . . . . . . . . . .
           // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
            // Any FALCONS . . . . . . . . . . .
                if (ship.hullid == 87) {
                    // If planet is unowned and has no Amorphs => colonize and react . . . . . . . . . .
                    if (debug) {console.log("        >>> check loaction FALCON: ID#"+ship.id);}
                    planet = vgap.planetAt(ship.x,ship.y)
                    if (planet === undefined){ if (debug)      {console.log("            >>> no planet at ("+ship.x+","+ship.y+")");}}
                    if (planet !== undefined){
                        if (planet.ownerid == pid) {if (debug) {console.log("            >>> orbiting OWN planet = id:"+planet.id);}}
                        if (planet.ownerid == 0 && planet.nativetype !== 5 && ship.transferclans == 0 && ship.clans > 0){
                            ship.transferclans = 1;     // beam transfer 1 clan
                            ship.clans -= 1;
                            ship.target = planet;
                            ship.targetx = ship.x;
                            ship.targety = ship.y;
                            ship.transfertargetid = planet.id;
                            ship.transfertargettype = 1;
                            ship.mission = 10;            // beam up fuel
                            ship.changed = 1
                            if (debug) {console.log("            >>> orbiting UNOWNED planet = id:"+planet.id);}
                        }
                    }
                    if (ship.friendlycode.match(/HYP/i)){
                        ship.warp = ship.engineid;
                        ship.friendlycode = loadFreighters.randFC(ship);
                        ship.mission = 4;   // set mission to SensorSweep
                    }

                } //  end FALCON processing loop . . . . . . . . . . .
            // - - ---    - --- - - --- - ---   - -- - ---- - -- - - --
            }
        }
    },

    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 7. Ship settings to ready for launch . . . . . .
    prepSHIP: function (ship, planet, fuel) {
        ship.warp = 9;                      // set warp speed in case it is a new LDSF
        //ship.readystatus = 1;             // set status from 'idle' to 'ready'
        ship.mission = 4;                   // set mission to sensor sweep
        var addFuel = fuel - ship.neutronium;
        if (planet.neutronium > addFuel + 100) {
            ship.neutronium += addFuel;
            planet.neutronium -= addFuel;
        }
    },
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    // 8. Remove all cargo on board . . . .
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
    // 9. Load clans, supplies and MCs . . . .. .
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
    // Helper Functions . . . . . . .
    //- --- --- - - --- --- ---- - - --- --- --- ---- -
    processload: function() {
        if (debug) { console.log("   >>> LoadFreighters: plugin start");}
        //mdsf_show = true;
        if (mdsf_run == true){
            if (vgap.settings.turn < turnLim){
                loadFreighters.loadMaster();  // auto-run loop
            }
            if (vgap.settings.turn >= turnLim){
                loadFreighters.shipControl(); // auto-run loop
            }
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




