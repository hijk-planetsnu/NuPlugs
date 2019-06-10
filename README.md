# NuPlugs
AddOn plugins for Planets NU client interface

hijk.planets@gmail.com

Professionally, I am a big-data, algorithm R&D type of coder. I've worked with assembly, fortran, c, c++, perl, python and some scala. I had minimal java experience prior to working on PlanetNu plugins. Please forgive any blatant rookie java mistakes that are likely to appear in my code. Always open to advice and guidance to better integrate with the PlanetNu mothership. 


5\. Ship Baptism - (190609 - beta). Want to have multiple ship name lists that can be swaped out as an option during any turn? The idea is to keep one internal ship name list that is used client-side, but before submitting the turn, the ship names could be changed with other lists and these would be the names that the other players would see and the names that would be used in explosion reports. I have to thank @McNimble for naming this plugin idea as "ShipBaptism".
  * see readme file for this plugin  
  * see partial screen shot  
  * html layout designed for LEGACY PlanetsNu on a large desktop screen. The javascript does work in the new mobile client, but with some funky font size disparities. However, given the info and controls embedded in the dashboard view, it is unlikely that it would be functional/practical to use on a small mobile device.  
    

4\. Set Map Focus -  A working plugin is available that sets the starmap default focus to the location of your HomeWorld. Planned improvements will be to add optional selections via a input dashboard to select how the x,y point should be calculated. Remember: beta. Better to try some initial tests on training games.

3\. Load Lady Royale - This was a suggested topic at @McNimble's PlanetCon 2017 talk and a code draft was written by @Whisperer. I have re-worked the structure to my way of thinking/tackling problems and added a few other automatic controls that I wanted in place for PRIV games. And I spent some time trying to use the ship-to-planet beam transfer variables as a way to try and have the clans onboard for MCs, and then transfered down to the planet population for growth calc (when a SB is not present and the "Unload Freighters" mission is not available.)

2\. Load Freighters  - early in game I use a repetitive load out for MDSF/LDSF and got tired of having to click for  colonists, fuel, supplies, MCs, warp speed, and ready status. This just automates the unload/load process at your HW starbase during the first 30 turns of a game. Updates have added specific control functions for Lizard Class Cruiders and PL21's. Each new race I play I will likely add in the routine load commands I use with the most common "work" ships.

1\. Draw Home World Warp Circles - utilizes the Nu Draw Map addon style of Note overlays to add 81, 162 and 243 ly radii circles around your homeworld at the start of a game.

2014
In the beginning . . . To learn how the Nu plugins work, I have used a few simple projects to explore graphic elements and ship + planet controls and variables. The code is highly derivative of other Nu plugin coders and I am thankful for the numerous examples of code I have examined from other execellent plugins.








