/****************************************************************************************
Script to take the variables from a location bar and turn them into JavaScript variables
 Written by Mark Wilton-Jones, V1 13/9/2001, complete rewrite to V3 (this) 20-21/12/2001
*****************************************************************************************

Please see http://www.howtocreate.co.uk/jslibs/ for details and a demo of this script
Please see http://www.howtocreate.co.uk/jslibs/termsOfUse.html for terms of use

This is version 3 of the script, allowing any valid variations of objects and arrays to
be used as variable names. This version of the script checks for validity and fails without
producing an error if invalid variations are used. The main portion is a full rewrite.

To use this script, if you want the variables to also be provided as part of an array,
add the lines:
<script type="text/javascript" language="javascript1.2">
<!--
var useArray = true;
//-->
</script>
<script src="PATH TO SCRIPT/locvar.js" type="text/javascript" language="javascript1.2"></script>
into your page before any scripts that need the variables

If you do not want the variables to also be provided as part of an array, add the line:
<script src="PATH TO SCRIPT/locvar.js" type="text/javascript" language="javascript1.2"></script>

note with these examples that varb%5B3%5D.fr%5B%27+t%27%20%20%5D%5B%20%22hi%22%5D is
escape("varb[3].fr[' t'  ][ \"hi\"]")
<input name="varb[3].fr[' t'][&quot;hi&quot;]"> will automatically escape when the form is
submitted. If you generate the URLs yourself, you will have to escape the variable names, as
well as their values.

eg 1.
if the URL ends with '?vara=help_me&varb%5B3%5D.fr%5B%27+t%27%20%20%5D%5B%20%22hi%22%5D=now_please&myImg.x=2&myImg.y=4' and
useArray = true, the script will create the following (note, all are string variables):
vara = 'help_me';
varb[3].fr[' t']["hi"] = 'now_please';
myImg.x = '2';
myImg.y = '4';
getVars[0] = 'help_me';
getVars[1] = 'now_please';
getVars[2] = '2';
getVars[3] = '4';
getVars['vara'] = 'help_me';
getVars['[3].fr[\' t\'  ][ "hi"]'] = 'now_please';
getVars['myImg.x'] = '2';
getVars['myImg.y'] = '4';

eg 2.
if the URL ends with '?vara=help_me&varb%5B3%5D.fr%5B%27+t%27%20%20%5D%5B%20%22hi%22%5D=now_please&myImg.x=2&myImg.y=4' and
you do not put var useArray = true, the script will create the following (note, all are string
variables):
vara = 'help_me';
varb[3].fr[' t']["hi"] = 'now_please';
myImg.x = '2';
myImg.y = '4';
_______________________________________________________________________________________

This script works by prefixing each variable name with 'window.' and then working through
checking each word in turn. If the word is found to be an object and the object does not
exist then it is created. The same is done for any arrays.

window.myVar.myVar2[5]['dfg']=10 is calculated as:
window is an object. It exists. Do not create it.
window.myVar is an object. It does not exist. Create it.
window.myVar.myVar2 is an array. It does not exist. Create it.
window.myVar.myVar2[5] is an array. It does not exist. Create it.
window.myVar.myVar2[5]['dfg'] is a value. Equate it.
_______________________________________________________________________________________*/

if (!window.useWindow) window.useWindow = window;

function locclean( locvarcl, loctrue ) {
	//convert stuff like:
	//%21%22%A3%24%25%5E%26*%28%29-_%3D%2B%7E%23%7B%7D%5B%5D%3A@%3B%27%3C%3E%3F%2C
	//into normal characters
	//I need to do these few myself because I need a different response to unescape
	var locvarar = new Array(/\+/g,/%27/g,/%5C/g,/%0A/g,/%0D/g,/%0C/g,/%0B/g), varlocar = new Array(" ","\\'","\\\\","\\n","\\r","\\f","'+unescape('%0B')+'"), x;
	if( loctrue ) { locvarar.length = 1; } //If I'm not using eval(), I only need to convert the +
	for( x = 0; x < locvarar.length ; x++ ) {
		locvarcl = locvarcl.replace( locvarar[x], varlocar[x] );
	}
	return unescape( locvarcl );
}
function findString(tempVal) { //returns the length of a valid string plus the whitespace around it
	if( tempVal.replace( /^\s*/, "" ).charAt( 0 ) != "'" && tempVal.replace( /^\s*/, "" ).charAt( 0 ) != '"' ) { return -1; }
	var backSl = 0; //I did have a regular expression to detect valid strings but NS4 had a bug that made it fail.
	for( var y = 1; ( backSl % 2 || tempVal.replace( /^\s*/, "" ).charAt( y ) != tempVal.replace( /^\s*/, "" ).charAt( 0 ) ) && y < tempVal.length - 1; y++ ) {
		if( !tempVal.replace( /^\s*/, "" ).charAt( y ).replace( /[\n\r\f]/, "" ) ) { return -1; }
		if( tempVal.replace( /^\s*/, "" ).charAt( y ) == "\\" && ( tempVal.replace( /^\s*/, "" ).charAt( y + 1 ) == "\\" || tempVal.replace( /^\s*/, "" ).charAt( y + 1 ) == tempVal.replace( /^\s*/, "" ).charAt( 0 ) ) ) {
			backSl++; } else { backSl = 0; } } if( y == 1 ) { y = 0; }
	return y + 1 + ( tempVal.length - tempVal.replace( /^\s*/, "" ).length ) + ( tempVal.replace( /^\s*/, "" ).substr( y + 1 ).length - tempVal.replace( /^\s*/, "" ).substr( y + 1 ).replace( /^\s*/, "" ).length );
}
var lvTempVar = window.useWindow.location.href.replace( /#.*/, "" ).replace( /&/g, "&window." ) + "&", getVars = new Array(), locvarx = 0, locvartemp = "";
//eg locvartemp = 'https://web.archive.org/web/20151107005241/http://www.blah.com/test.html?var1=car%20p&var2%5B3%5D.fr%255B%20t%5D%5Bhi%5D=carp2&myvar=sugar&iNm.x=2&iNm.y=4&'
//I need that last & in there so the script knows where the end of the last variable is
if( lvTempVar.indexOf( "?" ) + 1 && lvTempVar.substr( lvTempVar.indexOf( "?" ) + 1 ).length > 1 ) {
	//there are variables, what are they?
	lvTempVar = ( "window." + lvTempVar.substr( lvTempVar.indexOf( "?" ) + 1 ) );
	while( lvTempVar.indexOf( "&" ) + 1 ) {
		locvartemp += locclean( lvTempVar.substr( 0, lvTempVar.indexOf( "=" ) ), true ) + lvTempVar.substring( lvTempVar.indexOf( "=" ), lvTempVar.indexOf( "&" ) + 1 );
		lvTempVar = lvTempVar.substr( lvTempVar.indexOf( "&" ) + 1 );
	} //that unescaped the variable names but not the contents
	//eg locvartemp = 'window.var1=car%20p&window.var2[3].fr[' t']["hi"]=carp2&window.myvar=sugar&window.iNm.x=2&window.iNm.y=4&'
	lvTempVar = "window";
	//keep looking until you reach the end of the string
	while( locvartemp.length > 0 ) {
		//Check for Opera bug where RegExp are not properly matched
		if( "^fdg".replace( /\W[\w\W]*/, "" ) ) { window.defaultStatus = "Browser bug detected. Script aborted without error."; break; }
		if( locvartemp.charAt( locvartemp.search( /\W/ ) ) == "." ) { //That last one was an object
			if( typeof( eval( lvTempVar ) ) != "object" ) { eval( lvTempVar + " = new Object();" ); } //this is a valid object. create it.
			locvartemp = locvartemp.substr( locvartemp.indexOf( "." ) + 1 );
			//add the next valid word to the text to be evaluated
			lvTempVar += "." + locvartemp.substr( 0, locvartemp.search( /\W/ ) );
			if( locvartemp.search( /[a-z_]/i ) != 0 ) { locvartemp = "&"; continue; } //the . after an object MUST be followed by a-z, A-Z, _. Force safe failure
		} else { if( locvartemp.charAt( locvartemp.search( /\W/ ) ) == "[" ) { //That last one was an array
				if( typeof( eval( lvTempVar ) ) != "object" ) { eval( lvTempVar + " = new Array();" ); }
				if( locvartemp.charAt( locvartemp.indexOf( "[" ) + findString( locvartemp.substr( locvartemp.indexOf( "[" ) + 1 ) ) + 1 ) == "]" ) { //they have used quotes.
					lvTempVar += locvartemp.substr( locvartemp.indexOf( "[" ), findString( locvartemp.substr( locvartemp.indexOf( "[" ) + 1 ) ) + 2 ); //valid. Add [THEIR_STRING] to the text to be evaluated
					locvartemp = locvartemp.substr( locvartemp.indexOf( "[" ) + findString( locvartemp.substr( locvartemp.indexOf( "[" ) + 1 ) ) + 2 );
				} else { //they should have used a number. Have they? If not, force safe failure
					if( "" + parseInt( locvartemp.substring( locvartemp.indexOf( "[" ) + 1, locvartemp.indexOf( "]" ) ) ) + "" != locvartemp.substring( locvartemp.indexOf( "[" ) + 1, locvartemp.indexOf( "]" ) ).replace( /\s/g, "" ) || isNaN( parseInt( locvartemp.substring( locvartemp.indexOf( "[" ) + 1, locvartemp.indexOf( "]" ) ) ) ) ) {
						locvartemp = "&"; continue; }
					lvTempVar += locvartemp.substring( locvartemp.indexOf( "[" ), locvartemp.indexOf( "]" ) + 1 ); //valid. Add [THEIR_NUM] to the text to be evaluated
					locvartemp = locvartemp.substr( locvartemp.indexOf( "]" ) + 1 );
				}
				if( locvartemp.charAt( 0 ) != "[" && locvartemp.charAt( 0 ) != "." && locvartemp.charAt( 0 ) != "=" ) { locvartemp = "&"; continue; } //the ] after an array MUST be followed by . or [ or =. Force safe failure
			} else { if( locvartemp.charAt( locvartemp.search( /\W/ ) ) == "=" ) { //This is the end of the variable name
					//this is a valid variable. create it/them.
					eval( lvTempVar + " = '" + locclean( locvartemp.substring( locvartemp.indexOf( "=" ) + 1, locvartemp.indexOf( "&" ) ) ) + "';" );
					if( window.useArray ) { //they want the getVars array. Fill it up
						getVars[lvTempVar.replace( /window\./, "" )] = locclean( locvartemp.substring( locvartemp.indexOf( "=" ) + 1, locvartemp.indexOf( "&" ) ), true );
						getVars[locvarx] = locclean( locvartemp.substring( locvartemp.indexOf( "=" ) + 1, locvartemp.indexOf( "&" ) ), true );
						locvarx++;
					}
					//prepare to use the next variable
					locvartemp = locvartemp.substr( locvartemp.indexOf( "&" ) + 1 );
					lvTempVar = locvartemp.substr( 0, locvartemp.search( /\W/ ) );
				} else { //safe failure
					window.defaultStatus = "Invalid variable format. Script aborted without error.";
					getVars = new Array(); //remove older answers
					break; //They have put in a variable that does not have a valid name format. abort.
				}
			}
		}
	}
}
locvartemp = null; lvTempVar = null; locvarx = null; //clear up

/*
     FILE ARCHIVED ON 00:52:41 Nov 07, 2015 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 21:42:57 Oct 19, 2019.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  LoadShardBlock: 172.958 (3)
  captures_list: 204.766
  load_resource: 87.346
  exclusion.robots.policy: 0.234
  CDXLines.iter: 17.633 (3)
  PetaboxLoader3.resolve: 55.135
  exclusion.robots: 0.252
  RedisCDXSource: 7.071
  PetaboxLoader3.datanode: 174.117 (4)
  esindex: 0.02
*/