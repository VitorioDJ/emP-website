<?php

	$error = '';

	if ( array_key_exists('to', $_POST) ){

		$to 		= $_POST['to'];
		unset($_POST['to']);

		$from		= "user@domain.com";
		$name		= "Website User";
		$subject	= "Email from Your Website";
		$file		= '';
		$redirect	= 'https://ooblue.is';
		if(isset($_POST['from'])){
			$from 	= $_POST['from'];
			unset($_POST['from']);
		}

		if(isset($_POST['name'])){
			$name 	= $_POST['name'];
			unset($_POST['name']);
		}

		if(isset($_POST['subject'])){
			$subject 	= $_POST['subject'];
			unset($_POST['subject']);
		}


		if(isset($_POST['file'])){
			$file 	= $_POST['file'];
			unset($_POST['file']);
		}

		if(isset($_POST['redirect'])){
			$redirect 	= $_POST['redirect'];
			unset($_POST['redirect']);
		}

		$message = "";
	   	foreach ($_POST as $field => $data){

	   		$message = "<html><head><title>$subject</title></head><body>\n";
	   		foreach($_POST as $field => $data){
	   			$message .= "<div style='border-bottom:1px solid #dadada; padding-bottom:15px;margin-bottom:15px;'><strong>".ucwords($field)."</strong><br/>".stripslashes($data)."</div>\n";
	   		}
	   		$message .= "</body></html>";

		}

		// Collect CSV File Data
		if(!empty($file) ){
			$subject .= " - " . $file;
			
			$fname = "";

			$fname .= "../../" . $file . ".csv";
			$file_exists = file_exists($fname);
			$csv_titles = array();
			$csv_line = array();

			array_push($csv_line,'' . '"' . $name . '"');
	   		array_push($csv_line,'' . '"' . $from . '"');

	   		array_push($csv_titles,'' . "Name");
	   		array_push($csv_titles,'' . "From");

			foreach ($_POST as $field => $data){	
				array_push($csv_titles,'' . $field);
				array_push($csv_line,'' . '"' . $data . '"');
			}


			// Write to CSV file
			$csv_titles = implode(',',$csv_titles);

			$csv_line = implode(',',$csv_line);
			$csv_line = "\r\n" . $csv_line;

			$fcon = fopen($fname,'a');
			if(!$file_exists){fwrite($fcon,$csv_titles);}
			fwrite($fcon,$csv_line);
			fclose($fcon);
		}	


		// To send HTML mail, the Content-type header must be set
		define('HEADER_TRAIL', "\r\n");
		define('EMAIL_HTML', 1);
	   	$headers  = 'MIME-Version: 1.0' . HEADER_TRAIL;
	   	$headers .= ( ! EMAIL_HTML) ? 'Content-type: text;' . HEADER_TRAIL : 'Content-type: text/html; charset=iso-8859-1' . HEADER_TRAIL ;

	   	// Additional headers
	   	$headers .= "From: ".$name." <".$from.">" . HEADER_TRAIL;


	   	if(!mail($to, $subject, $message, $headers)){
	   		$error =
	   		'<div class="alert alert-danger alert-dismissible fade show" role="alert">
				<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				Error sending message. Please try again.
			</div>';
	   	}



	} else {
		$error =
		'<div class="alert alert-danger alert-dismissible fade show" role="alert">
			<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			There is no <strong> "to" </strong> field found in the form. Please follow the documentation.
		</div>';
	}


	if(!empty($error) ){
		header("HTTP/1.1 422 failed");
		echo $error;
	}
	else{
		header("HTTP/1.1 200 OK");
		echo
		'<div class="alert alert-success alert-dismissible fade show" role="alert">
			<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			Your response has been sent successfully.
		</div>
		<div>
           <a class="btn btn-block btn-success btn-lg hvr-sweep-top mb-1" href="';
        echo $redirect;   
        echo '">OK</a>
        </div>';
	}


?>
