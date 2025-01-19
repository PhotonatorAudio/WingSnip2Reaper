// localstorage und Cookies Funktionieren nicht bei Lokalen Dateien

let SnipFile_Content
let SnipFile_Name = ""
const ReaperIpTextbox = $("#opt_ReaperWebAddress");
const ReaperPortTextbox = $("#opt_ReaperWebPort");

// First Not A Wing Color, But wing Colors Starts at 1 / Hex Color
const WingColors = [	'#5f5f5f',	/*	0		Black			000 000 000		*/
								'#4575c8',	/*	1		Gray-Blue		*/
								'#26a4fe',	/*	2		Medium-Blue		*/
								'#4503fe',	/*	3		Dark-Blue		*/
								'#32cfd4',	/*	4		Türkis			*/
								'#2dbe3f',	/*	5		Grün			*/
								'#839904',	/*	6		Olive-Green		*/
								'#e6d60d',	/*	7		Gelb			*/
								'#ba651e',	/*	8		Orange			*/
								'#e01743',	/*	9		Red				*/
								'#fa6361',	/*	10		Coral			*/
								'#f91cfd',	/*	11		Pink			*/
								'#9a0dff'	/*	12		Mauve			*/
];
const TextColors = [	'#FFFFFF',	/*	0		*/
								'#FFFFFF',	/*	1		*/
								'#000000',	/*	2		*/
								'#FFFFFF',	/*	3		*/
								'#000000',	/*	4		*/
                                '#000000',	/*	5		*/
                                '#000000',	/*	6		*/
								'#000000',	/*	7		*/
								'#000000',	/*	8		*/
								'#000000',	/*	9		*/
								'#000000',	/*	10		*/
								'#000000',	/*	11		*/
								'#FFFFFF'	/*	12		*/
];

// Deaktiviere Async Ajax - Führt sonst zu problemen mit reaper -
// Es führte dazu dass z.B. der Befehl zum Färben ausgeführt wurde,
// bevor der entsprechende Track überhaupt angelegt wurde
jQuery.ajaxSetup({async:false});




function send2reaper(ssrc) {

	if ( SnipFile_Name === '' ){
		console.log( "No File Loaded" );
		return;
	}
	
	let SendInterface = $(ssrc).data( "interface" );
	console.log( SendInterface );

	let InterfaceData = Get_OutputIfData( SendInterface );
	console.log( InterfaceData );

	let outputMethode = $("input[name='opt_out_Typ']:checked").val();
	console.log( outputMethode );
	
	switch( outputMethode ) {
		case "Template":
			Output_Template(InterfaceData);
			break;
			
		case "WebDirect":
			Output_WebDirect(InterfaceData);
			break;
			
	}	
	
}

function Output_Template( InterfaceData ) {
	let OutputFileContent = "";
	let ReaperTrackNr = 1;
	let Interface_ChannelsCount = InterfaceData.length;
	for ( let index = 0, length = Interface_ChannelsCount; index < length; index++ ) {
		let Interface_ChannelNr = 	index + 1;

		let This_Src_ColorNr =		InterfaceData[index]['Color'];
		let This_Src_BackColorHex =	WingColors[ This_Src_ColorNr ];
		/*let This_Src_TextColorHex =	TextColors[ This_Src_ColorNr ];
		let This_Src_SrcGroup =		InterfaceData[index]['Src_Grp'];
		let This_Src_SrcNr =		InterfaceData[index]['Src_Nr'];
		let This_Src_Typ =			InterfaceData[index]['Typ'];*/
		let This_Src_Name =			InterfaceData[index]['Name'];
		let This_Src_StereoMode = 	InterfaceData[index]['StereoMode'];
		/*let This_Src_StereoSide = 	InterfaceData[index]['StereoSide'];*/

		let LastChannel =  ( (index + 1) === Interface_ChannelsCount );	// True Wenn letzter kanal
		let This_IsDualCh = (  This_Src_StereoMode === "ST" || This_Src_StereoMode === "M/S"  ); // True Wenn dieser Channel ein Dual

		let F_Ret_ProcessAsStereo = F_ProcessAsStereo( This_IsDualCh, LastChannel, Interface_ChannelNr, InterfaceData[index], InterfaceData[index+1]);
		let ProcessAsStereo = F_Ret_ProcessAsStereo['ProcessAsStereo'];

		let ReaperInput_Nr = Interface_ChannelNr - 1;
		let ReaperOutput_Nr = Interface_ChannelNr + 1023;
		if (ProcessAsStereo && $("#opt_outSet_UseStereoTracks").is(':checked') ) {
			ReaperInput_Nr += 1024;
			ReaperOutput_Nr -= 1024;
			index++;
		}


		OutputFileContent += '<TRACK\n';
		OutputFileContent += 'NAME "' + This_Src_Name + '"\n';

		if ( $("#opt_outSet_ColTrack").is(':checked') ) {
			OutputFileContent += 'PEAKCOL ' + HexCol2ReaperColor(This_Src_BackColorHex, 1) + '\n';
		}

		OutputFileContent += 'MAINSEND 0 0\n'; // 1. MainSend 2. SendChannel 0=1/2 | 1=2/3...

		let FlagMonInput = 1;
		let FlagRecEnabled = 0;
		let NrRecInput = -1;

		if ( $("#opt_outSet_DisInputMon").is(':checked') ) {
			FlagMonInput = 0;
		}
		if ( $("#opt_outSet_ArmTrack").is(':checked') ) {
			FlagRecEnabled = 1;
		}
		if ( $("#opt_outSet_AssignInput").is(':checked') ) {
			NrRecInput = ReaperInput_Nr;
		}
		OutputFileContent += 'REC ' + FlagRecEnabled + ' ' + NrRecInput + ' ' + FlagMonInput + ' 0 0 0 0 0\n';

		if ( $("#opt_outSet_AssignOutput").is(':checked') ) {
			OutputFileContent += 'HWOUT ' + ReaperOutput_Nr + ' 0 1 0 0 0 0 -1:U -1\n';
		}

		OutputFileContent += '>\n';
		ReaperTrackNr++;
	}




	download('hello.RTrackTemplate',OutputFileContent);
}

function Output_WebDirect( InterfaceData ) {
	let Reaper_Web_IP = $("#opt_ReaperWebAddress").val();
	let Reaper_Web_Port = $("#opt_ReaperWebPort").val();
	let Interface_ChannelsCount = InterfaceData.length;
	console.log( Reaper_Web_IP );
	console.log( Reaper_Web_Port );
	
	
	let ReaperAddress = "http://" + Reaper_Web_IP + ":" + Reaper_Web_Port;
	console.log( ReaperAddress );
	
	$.get( ReaperAddress + "/_/40296;40005;" );			// Select all Tracks; Delete Selected Tracks
	$.get( ReaperAddress + "/_/SET/TRACK//VOL/0.0;" );	// Set Main Fader to -oo
	$.get( ReaperAddress + "/_/40043" );					// jump to end of project



	let ReaperTrackNr = 1;
	for ( let index = 0, length = Interface_ChannelsCount; index < length; index++ ) {
		let Interface_ChannelNr = 	index + 1;

		let This_Src_ColorNr =		InterfaceData[index]['Color'];
		let This_Src_BackColorHex =	WingColors[ This_Src_ColorNr ];
		/*let This_Src_TextColorHex =	TextColors[ This_Src_ColorNr ];
		let This_Src_SrcGroup =		InterfaceData[index]['Src_Grp'];
		let This_Src_SrcNr =		InterfaceData[index]['Src_Nr'];
		let This_Src_Typ =			InterfaceData[index]['Typ'];*/
		let This_Src_Name =			InterfaceData[index]['Name'];
		let This_Src_StereoMode = 	InterfaceData[index]['StereoMode'];
		/*let This_Src_StereoSide = 	InterfaceData[index]['StereoSide'];*/

		let LastChannel =  ( (index + 1) === Interface_ChannelsCount );	// True Wenn letzter kanal
		let This_IsDualCh = (  This_Src_StereoMode === "ST" || This_Src_StereoMode === "M/S"  ); // True Wenn dieser Channel ein Dual

		let F_Ret_ProcessAsStereo = F_ProcessAsStereo( This_IsDualCh, LastChannel, Interface_ChannelNr, InterfaceData[index], InterfaceData[index+1]);
		let ProcessAsStereo = F_Ret_ProcessAsStereo['ProcessAsStereo'];

		let ReaperInput_Nr = Interface_ChannelNr - 1;
		if (ProcessAsStereo && $("#opt_outSet_UseStereoTracks").is(':checked') ) {
			ReaperInput_Nr += 1024;
			index++;
		}



		let combinedRequest = "";
		combinedRequest = combinedRequest + ReaperAddress + "/_/40001;";
		combinedRequest = combinedRequest + "SET/TRACK/" + ReaperTrackNr + "/P_NAME/" + This_Src_Name + ";";

		if ( $("#opt_outSet_ColTrack").is(':checked') ) {
			combinedRequest = combinedRequest + "SET/TRACK/" + ReaperTrackNr + "/I_CUSTOMCOLOR/" + HexCol2ReaperColor(This_Src_BackColorHex,0) + ";";
		}

		if ( $("#opt_outSet_DisInputMon").is(':checked') ) {
			combinedRequest = combinedRequest + "SET/TRACK/" + ReaperTrackNr + "/RECMON/3;";
		}

		if ( $("#opt_outSet_ArmTrack").is(':checked') ) {
			combinedRequest = combinedRequest + "SET/TRACK/" + ReaperTrackNr + "/RECARM/1;";
		}

		if ( $("#opt_outSet_AssignInput").is(':checked') ) {
			combinedRequest = combinedRequest + "SET/TRACK/" + ReaperTrackNr + "/I_RECINPUT/" + ReaperInput_Nr + ";";
		}

		$.ajax({
			url: combinedRequest,
			timeout: 250 //in milliseconds
		});
		ReaperTrackNr++;
	}
	
}


// Schreibe Daten für alle Output Interfaces in Tabellen ----------------------------------------------------
function UpdatePageData() {
	
	// check if File loaded
	if ( SnipFile_Name === '' ){
		console.log( "No File Loaded" );
		return;
	}
	
	let OutputInterfaces = ['A', 'B', 'C', 'CRD', 'MOD', 'SC', 'USB'];

	// Durch alle Output Interfaces loopen
	$.each( OutputInterfaces, function( if_key, if_value ) {

		// Kanäle des Interfaces laden
		let InterfaceData = Get_OutputIfData(if_value);
		let Interface_ChannelsCount = InterfaceData.length;
		let Interface_ErrorText = "";
		// console.log( InterfaceData );


		let Table_Interface_Channels = '#Interface_' + if_value + '_Channels';

		// Tabelle leeren und Kopfzeile Einfügen
		$( Table_Interface_Channels ).empty();
		$( Table_Interface_Channels ).append( '<tr></tr>' );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>OUT</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>Src_Grp</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>Src_Nr</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>Typ</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>Name</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>StereoMode</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>StereoSide</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>Color</td>" );
		$( Table_Interface_Channels + ' tr:last' ).append( "<td>Debug</td>" );





		// Durch alle Kanäle des Interfaces Loopen
		for ( let index = 0, length = Interface_ChannelsCount; index < length; index++ ) {
			let Interface_ChannelNr = 	index + 1;

			let This_Src_ColorNr =		InterfaceData[index]['Color'];
			let This_Src_BackColorHex =	WingColors[ This_Src_ColorNr ];
			let This_Src_TextColorHex =	TextColors[ This_Src_ColorNr ];
			let This_Src_SrcGroup =		InterfaceData[index]['Src_Grp'];
			let This_Src_SrcNr =		InterfaceData[index]['Src_Nr'];
			let This_Src_Typ =			InterfaceData[index]['Typ'];
			let This_Src_Name =			InterfaceData[index]['Name'];
			let This_Src_StereoMode = 	InterfaceData[index]['StereoMode'];
			let This_Src_StereoSide = 	InterfaceData[index]['StereoSide'];

			let LastChannel =  ( (index + 1) === Interface_ChannelsCount );	// True Wenn letzter kanal
			let This_IsDualCh = (  This_Src_StereoMode === "ST" || This_Src_StereoMode === "M/S"  ); // True Wenn dieser Channel ein Dual

			let F_Ret_ProcessAsStereo = F_ProcessAsStereo( This_IsDualCh, LastChannel, Interface_ChannelNr, InterfaceData[index], InterfaceData[index+1]);
			let ProcessAsStereo = F_Ret_ProcessAsStereo['ProcessAsStereo'];
			let DebugString = F_Ret_ProcessAsStereo['DebugString'];
			Interface_ErrorText += F_Ret_ProcessAsStereo['ErrorText'];


			if ( ProcessAsStereo ){
				let Next_Src_ColorNr =		InterfaceData[ index + 1 ]['Color'];
				let Next_Src_BackColorHex =	WingColors[ This_Src_ColorNr ];
				let Next_Src_TextColorHex =	TextColors[ This_Src_ColorNr ];
				let Next_Src_SrcGroup =		InterfaceData[ index + 1 ]['Src_Grp'];
				let Next_Src_SrcNr =		InterfaceData[ index + 1 ]['Src_Nr'];
				let Next_Src_Typ =			InterfaceData[ index + 1 ]['Typ'];
				/*let Next_Src_Name =			InterfaceData[ index + 1 ]['Name'];
				let Next_Src_StereoMode = 	InterfaceData[ index + 1 ]['StereoMode'];*/
				let Next_Src_StereoSide = 	InterfaceData[ index + 1 ]['StereoSide'];

				$(Table_Interface_Channels).append( '<tr style="color: ' + This_Src_TextColorHex + '; background-color: ' + This_Src_BackColorHex + '"></tr>' );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Interface_ChannelNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_SrcGroup + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_SrcNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_Typ + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td rowspan='2'>" + This_Src_Name + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td rowspan='2'>" + This_Src_StereoMode + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_StereoSide + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_ColorNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + DebugString + "</td>" );

				$(Table_Interface_Channels).append( '<tr style="color: ' + Next_Src_TextColorHex + '; background-color: ' + Next_Src_BackColorHex + '"></tr>' );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + ( Interface_ChannelNr + 1 )+ "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Next_Src_SrcGroup + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Next_Src_SrcNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Next_Src_Typ + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Next_Src_StereoSide + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Next_Src_ColorNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + DebugString + "</td>" );

				index++;



			} else {
				$(Table_Interface_Channels).append( '<tr style="color: ' + This_Src_TextColorHex + '; background-color: ' + This_Src_BackColorHex + '"></tr>' );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + Interface_ChannelNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_SrcGroup + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_SrcNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_Typ + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_Name + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_StereoMode + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_StereoSide + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + This_Src_ColorNr + "</td>" );
				$(Table_Interface_Channels + ' tr:last').append( "<td>" + DebugString + "</td>" );
			}



		}

		$('#OutputError_' + if_value).html( Interface_ErrorText );
		//OutputError_SC

	})


}

function F_ProcessAsStereo( This_IsDualCh, LastChannel, Interface_ChannelNr, This_InterfaceData, Next_InterfaceData) {
	let Interface_ErrorText = "";
	let DebugString = "";
	let ProcessAsStereo = false;
	if ( This_IsDualCh ){
		// Wenn Channel Stereo / M/S
		if ( !isEven( This_InterfaceData['Src_Nr'] ) ){
			// Wenn Source Left oder Mid
			if ( !isEven( Interface_ChannelNr ) ) {
				// Wenn Output Ch ungerade
				if (!LastChannel) {
					// Wenn nicht letzter Output Ch
					let Next_Src_SrcGroup = Next_InterfaceData['Src_Grp'];
					let Next_Src_SrcNr = Next_InterfaceData['Src_Nr'];
					let SameSourceGroup = (This_InterfaceData['Src_Grp'] === Next_Src_SrcGroup); // Wenn Dieser und Nächste Sourche Group gleich

					if (SameSourceGroup && (((This_InterfaceData['Src_Nr'] + 1) === Next_Src_SrcNr))) {
						// Wenn aufeinanderfolgende Source Channels
						ProcessAsStereo = true;
						DebugString = "Jo";
					} else {
						Interface_ErrorText += "Out " + Interface_ChannelNr + " >" + This_InterfaceData['Name'] + "< Nachfolgende Kanal gehört nicht zur stereo Source<br/>\n";
					}
				} else {
					Interface_ErrorText += "Out " + Interface_ChannelNr + " >" + This_InterfaceData['Name'] + "< Letzter Kanal von Output - Das kann kein Stereo mehr werden<br/>\n";
				}
			} else {
				Interface_ErrorText += "Out " + Interface_ChannelNr + " >" + This_InterfaceData['Name'] + "< Erster Stereo Kanal muss auf ungeraden Output liegen<br/>\n";
			}
		}
	}
	return	{	'ErrorText':		Interface_ErrorText,
				'DebugString':		DebugString,
				'ProcessAsStereo':	ProcessAsStereo
	};
}

// Gibt alle Kanäle eines Interfaces mit seinen Daten zurück ------------------------------------------------
function Get_OutputIfData( OutIf ) {
	let OutInterface_Data = [];
	let Arr_InterfaceChannels = SnipFile_Content['ae_data']['io']['out'][OutIf];
	
	// Loop through all channels of Interface
	$.each( Arr_InterfaceChannels, function( key, value ) {
		let Src_Grp =	value['grp'];
		let Src_Nr = value['in'];
		OutInterface_Data.push (Get_Snippet_Source_Data( SnipFile_Content, Src_Grp, Src_Nr ));
	})

	return OutInterface_Data;
}



// Gibt Daten für einen Kanal im Ausgabeinterface zurück ----------------------------------------------------
// 	Typ			-	User / Bus / FxSend / Monitor / OFF / Input
// 	Name		-	Source Name
// 	Color		-	Source Color
// 	StereoMode	-	Source Stero Mode - ST / M / MS
// 	StereoSide	-	Source Stereo Side - Mono | [Left/Right] | [Mid/Side]
// 	Src_Grp		-	Returns the input Group
// 	Src_Nr		-	Returns the input Number
function Get_Snippet_Source_Data( SnipData, i_Src_Grp, i_Src_Nr ) {
	let BusNr = Math.floor((i_Src_Nr + 1) / 2);	// Bus Nummer errechnen - Ein Bus hat 2 Sources L/R oder M/M
	let lc_Src_Grp = i_Src_Grp.toLowerCase();		// Bus group kleingeschrieben

	// Definiere Variablen
	let Src_Name= "NotSet";
	let Src_Color= -1000;
	let Src_StereoMode= "NotSet";
	let Src_StereoSide= "NotSet";
	let Src_Typ= "NotSet";
	let Src_Data

	switch( i_Src_Grp ) {
		case 'LCL':
		case 'AUX':
		case 'A':
		case 'B':
		case 'C':
		case 'SC':
		case 'USB':
		case 'CRD':
		case 'MOD':
		case 'PLAY':
		case 'AES':
		case 'OSC':	// -----------------------------------------------------------------------------------------------------------------------------
			// console.log( "Case Input" );
			Src_Data = 			SnipData['ae_data']['io']['in'][i_Src_Grp][i_Src_Nr];	// Read Source Data To Smaller Array

			Src_Name =			Src_Data['name'];
			Src_Color =			Src_Data['col'];
			Src_StereoMode =	Src_Data['mode'];
			Src_StereoSide =	Get_ChannelStereoSide(Src_StereoMode, i_Src_Nr );
			Src_Typ	=			"Input";
			break;

		case 'OFF':	// -----------------------------------------------------------------------------------------------------------------------------
			// console.log( "Case OFF" );
			Src_Name =			"-";
			Src_Color =			0;
			Src_StereoMode =	"-";
			Src_StereoSide =	"-";
			Src_Typ	=			"OFF";
			break;

		case 'MON': // -----------------------------------------------------------------------------------------------------------------------------
			// console.log( "Case Mon" );

			Src_Color = 6;
			Src_StereoMode =	"ST";
			Src_Typ	=			"Monitor";
			switch( i_Src_Nr ) {
				case 1:	// Monitor Ch 1 immer Kopfhörer Links
					Src_Name = 			"Monitor - Phones";
					Src_StereoSide =	"Left";
					break;
				case 2:	// Monitor Ch 2 immer Kopfhörer Rechts
					Src_Name = 			"Monitor - Phones";
					Src_StereoSide =	"Right";
					break;
				case 3:	// Monitor Ch 3 immer Lautsprecher Links
					Src_Name = 			"Monitor - Speaker";
					Src_StereoSide =	"Left";
					break;
				case 4: // Monitor Ch 4 immer Lautsprecher Rechts
					Src_Name = 			"Monitor - Speaker";
					Src_StereoSide =	"Right";
					break;
			}
			break;

		case 'SEND':// -----------------------------------------------------------------------------------------------------------------------------
			// console.log( "Case Send" );

			Src_Color = 		11;
			Src_StereoMode =	"ST";
			Src_Typ	=			"FxSend";
			Src_Name = 			"Fx " + BusNr + " Send";
			Src_StereoSide =	Get_ChannelStereoSide(Src_StereoMode, i_Src_Nr );
			break;

		case 'BUS':
		case 'MAIN':
		case 'MTX':// -----------------------------------------------------------------------------------------------------------------------------
			// console.log( "Case Bus" );

			Src_Data =		SnipData['ae_data'][lc_Src_Grp][BusNr];	// Daten für bus lesen
			/*	busmode:"PRE" | busmono:false | col:1 | mon:"A" | mute:false | name:"Bus...01" | pan:0 | led:true | fdr:-144 | icon:0 | tags:"" | wid:100 */

			Src_Name =		Src_Data['name'];
			Src_Color =		Src_Data['col'];
			Src_Typ	=		"Bus";

			// Convert to Mono Stereo flag
			if ( Src_Data['busmono'] ){
				Src_StereoMode =	"M";
			} else {
				Src_StereoMode =	"ST";
			}

			Src_StereoSide =	Get_ChannelStereoSide(Src_StereoMode, i_Src_Nr );
			break;

		case 'USR':// -----------------------------------------------------------------------------------------------------------------------------
			// console.log( "Case User" );
			// To Complex to implement
			Src_Data = 			SnipData['ae_data']['io']['in'][i_Src_Grp][i_Src_Nr];
			Src_Name =			Src_Data['name'];
			Src_Color =			Src_Data['col'];
			Src_StereoMode =	Src_Data['mode'];
			Src_StereoSide =	Get_ChannelStereoSide(Src_StereoMode, i_Src_Nr );
			Src_Typ	=			"User";
			break;

		default:// -----------------------------------------------------------------------------------------------------------------------------
			console.log( "Case Else - " + i_Src_Grp + " - " + i_Src_Nr );
			

	}

	// console.log( "Exit Get_Snippet_Source_Data >> " + i_Src_Grp + " - " + i_Src_Nr );
	return	{	'Typ':			Src_Typ,
				'Name':			Src_Name,
				'Color':		Src_Color,
				'StereoMode':	Src_StereoMode,
				'StereoSide':	Src_StereoSide,
				'Src_Grp':		i_Src_Grp,
				'Src_Nr':		i_Src_Nr
			};

}





/* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** *****                               ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** *****         File  Loading         ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** *****                               ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */

// funktion die ausgeführt wird, wennDatei gewählt wurde ----------------------------------------------------
onFileSelected = function(){

	let file = $(this)[0].files[0];
	let FileName = file.name;

	// Teste ob Dateiendung richtig
	//if (file.name.match(/\.(snap|json)$/)) { // Support multiple Filetypes
	if (file.name.match(/\.snap$/)) {
		let reader = new FileReader();

		reader.onload = function() {
			SnipFile_Name = FileName;
			ReadFile( reader.result );
			UpdatePageData();
		};

		reader.readAsText(file);
	} else {
		// Dateiendung nicht korrekt
		alert("File not supported, .snap files only");
		SnipFile_Content = "";
		SnipFile_Name = "";
	}
};


// Lese gewählte Snipp Datei zu Globales Array --------------------------------------------------------------
function ReadFile( SnipFile_Raw ){
	//	konvertiere JSON zu Globales Array
	SnipFile_Content = $.parseJSON( SnipFile_Raw );

	// Debug - Zeige Datei in Debug Konsole
	// console.log( "SnipFile_Content" );
	// console.log( SnipFile_Content );

	// Zeige Dateiinfo auf Seite
	Page_WriteFileInfo	(	SnipFile_Name,
							SnipFile_Content['creator_model'],
							SnipFile_Content['creator_sn'],
							SnipFile_Content['created'],
							SnipFile_Content['creator_fw'],
							SnipFile_Content['creator_name']
						);

}

//	Zeige Dateiinfo auf Seite -------------------------------------------------------------------------------
function Page_WriteFileInfo( SnipFile_Name, var_SnipFile_ConsoleTyp, var_SnipFile_ConsoleSerial, var_SnipFile_Created, var_SnipFile_ConsoleFirmware, var_SnipFile_ConsoleName ){

	// Wenn Wert ist null, dann zu "-" ändern
	if(SnipFile_Name == null){					SnipFile_Name = '-';				}
	if(var_SnipFile_ConsoleTyp == null){		var_SnipFile_ConsoleTyp = '-';		}
	if(var_SnipFile_ConsoleSerial == null){		var_SnipFile_ConsoleSerial = '-';	}
	if(var_SnipFile_Created == null){			var_SnipFile_Created = '-';			}
	if(var_SnipFile_ConsoleFirmware == null){	var_SnipFile_ConsoleFirmware = '-';	}
	if(var_SnipFile_ConsoleName == null){		var_SnipFile_ConsoleName = '-';		}

	// Wert auf Seite schreiben
	$('#span_SnipFile_FileName').text( SnipFile_Name );
	$('#span_SnipFile_ConsoleTyp').text( var_SnipFile_ConsoleTyp );
	$('#span_SnipFile_ConsoleSerial').text( var_SnipFile_ConsoleSerial );
	$('#span_SnipFile_Created').text( var_SnipFile_Created );
	$('#span_SnipFile_ConsoleFirmware').text( var_SnipFile_ConsoleFirmware );
	$('#span_SnipFile_ConsoleName').text( var_SnipFile_ConsoleName );
}










/* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** *****                               ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** *****       Helper  Functions       ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** *****                               ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}


// Funktion die eine HexFarbe als Reaper Farb-Nr. zurückgibt ------------------------------------------------
const HexCol2ReaperColor = (hex, calcmethode) => {
	// Zerlege RGB-Hex in Grundfarben-Hex
    let r = parseInt(hex.slice(1, 3), 16);
	let g = parseInt(hex.slice(3, 5), 16);
	let b = parseInt(hex.slice(5, 7), 16);

	if (calcmethode === 0 ){ // for web command
		// Reaper "Addiert" 16777216 (0x1000000) zur Farbe
		return (r * 65536) + (g * 256) + b + 16777216; // 16777216 = 0x1000000 = R0 G0 B0 // Default Wert

	} else if (calcmethode === 1 ){ // for template
		// Reaper "Addiert" 16777216 (0x1000000) zur Farbe
		return (b * 65536) + (g * 256) + r + 16777216; //
	}


}

// Funktion die zurückgibt ob Zahl Gerade ist ---------------------------------------------------------------
function isEven(n) {
    return (n % 2 === 0);
}

// Funktion die ein Kürzel für die verwendete Stereo Seite zurückgibt ---------------------------------------
// Output:	Mono | [Left/Right] | [Mid/Side]
function Get_ChannelStereoSide( StereoMode, ChannelNr ) {
	let Side = "";

	if ( StereoMode === 'M'  ) {
		// Wenn Mono
		Side = "Mono";

	} else if ( StereoMode === 'ST'  ) {
		// Wenn Stereo
		if ( isEven(ChannelNr)  ) {
			// Wenn Stereo Quelle gerade, dann ist Kanal "Rechts"
			Side = "Right"
		} else {
			// Wenn Stereo Quelle ungerade, dann ist Kanal "Links"
			Side = "Left"
		}

	} else if ( StereoMode === 'M/S'  ) {
		// Wenn Mid/Side
		if ( isEven(ChannelNr)  ) {
			// Wenn Mid/Side Quelle gerade, dann ist Kanal "Side"
			Side =  "Side"
		} else {
			// Wenn Mid/Side Quelle ungerade, dann ist Kanal "Mid"
			Side = "Mid"
		}

	} else  {
		// Debug nicht behandelten Stereomode
		console.log( "Get_ChannelStereoSide >>> StMode: " + StereoMode + " - Ch-Nr: " + ChannelNr );
	}
	return Side;
}


// Cookie Speichern/Lesen.
// Verwendet, um gewählte Einstellungen zu speichern. -------------------------------------------------------
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	let expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=Strict;";
}

// Verwendet, um gewählte Einstellungen zu lesen. -----------------------------------------------------------
function getCookie(cname) {
	let name = cname + "=";
	let ca = document.cookie.split(';');
	for(let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function ValideIpAdress (ipstring) {
	const ipv4Regex = "^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$";
	let pattern = new RegExp(ipv4Regex);
	return pattern.test(ipstring);
}

function OutputModeChange() {


	$('#OutputOpt_FeatureList_AddTrack').removeAttr("class");
	$('#OutputOpt_FeatureList_NameTrack').removeAttr("class");
	$('#OutputOpt_FeatureList_ColorTrack').removeAttr("class");
	$('#OutputOpt_FeatureList_ArmTrack').removeAttr("class");
	$('#OutputOpt_FeatureList_AssignInput').removeAttr("class");
	$('#OutputOpt_FeatureList_DissableMon').removeAttr("class");
	$('#OutputOpt_FeatureList_AssignOutput').removeAttr("class");

	let ActionType = $('input[name="opt_out_Typ"]:checked').val();
	if (ActionType === 'WebDirect') {
		//console.log( "WebDirect" );

		$('#OutputOpt_FeatureList_AddTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_NameTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_ColorTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_ArmTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_AssignInput').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_DisableMon').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_AssignOutput').addClass( "OutputOpt_FeatureList_cross" );
		$('#opt_outSet_AssignOutput').prop("checked", false);
	} else if (ActionType === 'Template') {
		//console.log( "Template" );
		$('#OutputOpt_FeatureList_AddTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_NameTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_ColorTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_ArmTrack').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_AssignInput').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_DisableMon').addClass( "OutputOpt_FeatureList_check" );
		$('#OutputOpt_FeatureList_AssignOutput').addClass( "OutputOpt_FeatureList_check" );

	}
	SetAllCookies()
}

function SetAllCookies() {

	setCookie('Reaper_Opt_ColorTrack', $("#opt_outSet_ColTrack").is(':checked'), 100000);
	setCookie('Reaper_Opt_ArmTrack', $("#opt_outSet_ArmTrack").is(':checked'), 100000);
	setCookie('Reaper_AssignInput', $("#opt_outSet_AssignInput").is(':checked'), 100000);
	setCookie('Reaper_DisInputMon', $("#opt_outSet_DisInputMon").is(':checked'), 100000);
	setCookie('Reaper_AssignOutput', $("#opt_outSet_AssignOutput").is(':checked'), 100000);
	setCookie('Reaper_UseStereoTracks', $("#opt_outSet_UseStereoTracks").is(':checked'), 100000);

	let ActionType = $('input[name="opt_out_Typ"]:checked').val();
	setCookie('ExportMode', ActionType, 100000);


	if ( ValideIpAdress( $("#opt_ReaperWebAddress").val() ) ){
		setCookie('Reaper_IP', $("#opt_ReaperWebAddress").val(), 100000);
	}

	if ( $.isNumeric( $("#opt_ReaperWebPort").val() ) ){
		setCookie('Reaper_Port', $("#opt_ReaperWebPort").val(), 100000);
	}


}



/* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** *****                               ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** *****        Document  Ready        ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** *****                               ***** ***** ***** ***** ***** ***** ***** */
/* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */

$(document).ready(function() {
	// Load Cookie ---------------------------------------------------------------------------------------------

	//Testen ob cookie gesetzt werden kann
	setCookie('WingSnap2Reaper', true, 100);


	if ( getCookie('WingSnap2Reaper') === "" ) {
		//Cookies können nicht gespeichert werden
		console.log( "Cookiemonster Sad - No Cookie Found" );

	} else {
		//Cookies können gespeichert werden
		console.log( "Cookienom..mom..nomster" );

		$('#opt_outSet_ColTrack').prop("checked",			( getCookie('Reaper_Opt_ColorTrack' ) === 'true') );
		$('#opt_outSet_ArmTrack').prop("checked",			( getCookie('Reaper_Opt_ArmTrack' ) === 'true'));
		$('#opt_outSet_AssignInput').prop("checked",		( getCookie('Reaper_AssignInput' ) === 'true') );
		$('#opt_outSet_DisInputMon').prop("checked",		( getCookie('Reaper_DisInputMon' ) === 'true') );
		$('#opt_outSet_AssignOutput').prop("checked",		( getCookie('Reaper_AssignOutput' ) === 'true') );
		$('#opt_outSet_UseStereoTracks').prop("checked",	( getCookie('Reaper_UseStereoTracks' ) === 'true') );


		// Lese Reaper ip von Cookie ------------------------------------------------------------------------
		let CookieVal_ReaperIP = getCookie('Reaper_IP')
		if ( ValideIpAdress( CookieVal_ReaperIP )  ){
			ReaperIpTextbox.val(CookieVal_ReaperIP);
		}

		// Lese Reaper Port von Cookie ----------------------------------------------------------------------
		let CookieVal_ReaperPort = getCookie('Reaper_Port')
		if ( $.isNumeric( CookieVal_ReaperPort ) ){
			//alert("The text has been changed.");
			ReaperPortTextbox.val(CookieVal_ReaperPort);
		}

		// Lese Reaper Port von Cookie ----------------------------------------------------------------------
		let CookieVal_ExportMode = getCookie('ExportMode');
		if ( CookieVal_ExportMode === 'WebDirect' ) {
			$('#opt_outTyp_Web').prop("checked", true);
		} else if ( CookieVal_ExportMode === 'Template' ) {
			$('#opt_outTyp_Template').prop("checked", true);
		}
		OutputModeChange();

		// Definiere Aktion wenn Reaper IP geändert wird ----------------------------------------------------
		$("#opt_ReaperWebAddress").change(function(){
			//alert("The text has been changed.");
			if ( ValideIpAdress( $("#opt_ReaperWebAddress").val() )  ){
				SetAllCookies();
				$("#opt_ReaperWebAddress").css({"color": ""});
			} else {
				$("#opt_ReaperWebAddress").css({"color": "red"});
			}
		});

		// Definiere Aktion wenn Reaper Port geändert wird  -------------------------------------------------
		$("#opt_ReaperWebPort").change(function(){
			//alert("The text has been changed.");
			if ( $.isNumeric( $("#opt_ReaperWebPort").val() )  ){
				SetAllCookies();
				$("#opt_ReaperWebPort").css({"color": ""});
			} else {
				$("#opt_ReaperWebPort").css({"color": "red"});
			}
		});




	} // End Cookie loading ---------------------------------------------------------------------------------




	$('#opt_outSet_ColTrack').change(function() {			SetAllCookies();	});
	$('#opt_outSet_ArmTrack').change(function() {			SetAllCookies();	});
	$('#opt_outSet_AssignInput').change(function() {		SetAllCookies();	});
	$('#opt_outSet_DisInputMon').change(function() {		SetAllCookies();	});
	$('#opt_outSet_AssignOutput').change(function() {		SetAllCookies();	});
	$('#opt_outSet_UseStereoTracks').change(function() {	SetAllCookies();	});

	// Definiere Aktion für den Load Snip Button ------------------------------------------------------------
	$("#btn_LoadFile").on("click",function(){
		let fileDialog = $('<input type="file">');
		fileDialog.click();
		fileDialog.on("change",onFileSelected);
		return false;
	});

	// Output Interface Spoiler Ein- und Ausklappen ---------------------------------------------------------
	const summaries = document.querySelectorAll('summary');
	summaries.forEach((summary) => {
		summary.addEventListener('click', closeOpenedDetails);
	});
	function closeOpenedDetails() {
		summaries.forEach((summary) => {
			let detail = summary.parentNode;
			if (detail !== this.parentNode) {
				detail.removeAttribute('open');
			}
		});
	}

	// Definiere Aktionen, wenn Output Typ geändert wird.
	// Hier werden nur die symbole der möglichen funktionen geändert. ---------------------------------------
	$('input[type=radio][name=opt_out_Typ]').change(function() {
		OutputModeChange();
	});







});