<script>
	import Header from '../Header.svelte';
</script>

<Header />

<svelte:head>
	<title>SOS2425-11 - About</title>
	<meta name="description" content="About the SOS2425-11 project and team" />
</svelte:head>

<div class="about-container">
	<h1 class="title">SOS2425-11 Project Information</h1>

	<section class="team-section">
		<h2><i class="fas fa-users"></i> Team Members</h2>
		<ul>
			<li>
				Eduardo Becerra Tomé (<a
					href="https://github.com/EduardoBecTom"
					target="_blank"
					rel="noopener noreferrer">@edubectom</a
				>)
			</li>
			<li>
				Mario Tur Pantión (<a
					href="https://github.com/mariotuur"
					target="_blank"
					rel="noopener noreferrer">@mariotuur</a
				>)
			</li>
			<li>
				Antonio Manuel Luque Molina (<a
					href="https://github.com/antluqmol1"
					target="_blank"
					rel="noopener noreferrer">@antluqmol1</a
				>)
			</li>
		</ul>
	</section>

	<section class="project-details">
		<h2><i class="fas fa-project-diagram"></i> Project Details</h2>
		<ul>
			<li>
				<strong>Description:</strong> Our information sources focus on analyzing the evolution of aid
				for dependent individuals in Spain, examining key aspects such as social and economic support
				systems.
			</li>
			<li>
				<strong>Repository:</strong>
				<a href="https://github.com/gti-sos/SOS2425-11" target="_blank" rel="noopener noreferrer"
					><i class="fab fa-github"></i> gti-sos/SOS2425-11</a
				>
			</li>
			<li>
				<strong>Live URL:</strong>
				<a href="https://sos2425-11.onrender.com/" target="_blank" rel="noopener noreferrer"
					><i class="fas fa-globe"></i> sos2425-11.onrender.com</a
				>
			</li>
		</ul>
	</section>

	<section class="api-section">
		<h2><i class="fas fa-cogs"></i> APIs</h2>
		<ul>
			<li>
				<a
					href="/api/v1/autonomy-dependence-applications/docs"
					target="_blank"
					rel="noopener noreferrer">Autonomy Dependence Applications API</a
				> (Antonio Manuel Luque Molina)
			</li>
			<li>
				<a href="/api/v1/social-pension-payrolls/docs" target="_blank" rel="noopener noreferrer"
					>Social Pension Payrolls API</a
				> (Eduardo Becerra Tomé)
			</li>
			<li>
				<a href="/api/v1/management-evolutions/docs" target="_blank" rel="noopener noreferrer"
					>Management Evolutions API</a
				> (Mario Tur Pantión)
			</li>
		</ul>
	</section>

	<section class="videos-section">
		<h2><i class="fas fa-video"></i> Project Explanatory Videos</h2>
		<ul>
			<li>
				Antonio Manuel Luque Molina: <a
					href="https://www.loom.com/share/d836356efbf34bdb8f71f16c92dd9818?sid=f4ddb9fd-984b-42b8-8007-f7e609b06acd"
					target="_blank"
					rel="noopener noreferrer">View Video</a
				>
			</li>
			<li>Eduardo Becerra Tomé: (Link to video)</li>
			<li>
				Mario Tur Pantión: <a
				href="https://youtu.be/3zcTfa7vEIA"
				target="_blank"
				rel="noopener noreferrer">View Video</a
				>
			</li>
		</ul>
	</section>

	<a href="/" class="back-button"><i class="fas fa-arrow-left"></i> Volver</a>
</div>

<style>
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'); /* Font Awesome for icons */

	:root {
		--primary-color: #007bff;
		--secondary-color: #6c757d;
		--background-color: #f8f9fa;
		--card-background: #ffffff;
		--text-color: #343a40;
		--link-color: #0056b3;
		--border-color: #dee2e6;
		--shadow-color: rgba(0, 0, 0, 0.1);
	}

	.about-container {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		max-width: 800px;
		margin: 40px auto;
		padding: 30px;
		background-color: var(--card-background);
		border-radius: 12px;
		box-shadow: 0 4px 12px var(--shadow-color);
		color: var(--text-color);
		line-height: 1.7;
	}

	.title {
		color: var(--primary-color);
		text-align: center;
		margin-bottom: 30px;
		font-size: 2.5em;
		font-weight: 600;
		border-bottom: 2px solid var(--primary-color);
		padding-bottom: 10px;
	}

	section {
		margin-bottom: 30px;
		padding: 20px;
		background-color: var(--background-color);
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	h2 {
		color: var(--secondary-color);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 8px;
		margin-bottom: 15px;
		font-size: 1.5em;
		font-weight: 500;
		display: flex;
		align-items: center;
	}

	h2 i {
		margin-right: 10px;
		color: var(--primary-color);
	}

	ul {
		list-style: none; /* Remove default bullets */
		padding-left: 0;
	}

	li {
		margin-bottom: 12px;
		padding-left: 20px; /* Indent list items */
		position: relative;
	}

	li::before {
		/* Custom bullet point */
		content: '•';
		color: var(--primary-color);
		font-weight: bold;
		display: inline-block;
		width: 1em;
		margin-left: -1.5em; /* Position bullet */
		position: absolute;
		left: 15px;
		top: 0px;
	}

	li strong {
		font-weight: 600;
		color: var(--text-color);
	}

	a {
		color: var(--link-color);
		text-decoration: none;
		transition:
			color 0.2s ease-in-out,
			text-decoration 0.2s ease-in-out;
	}

	a:hover {
		color: var(--primary-color);
		text-decoration: underline;
	}

	a i {
		/* Icon styling within links */
		margin-right: 5px;
	}

	.back-button {
		display: inline-block;
		margin-top: 20px;
		padding: 10px 20px;
		background-color: var(--primary-color);
		color: white;
		border-radius: 5px;
		text-decoration: none;
		font-weight: 500;
		transition:
			background-color 0.2s ease-in-out,
			transform 0.1s ease;
		border: none;
		cursor: pointer;
		text-align: center;
	}

	.back-button i {
		margin-right: 8px;
	}

	.back-button:hover {
		background-color: var(--link-color);
		text-decoration: none; /* Remove underline on hover for button */
		transform: translateY(-1px);
	}

	.back-button:active {
		transform: translateY(0);
	}

	/* Responsive adjustments */
	@media (max-width: 600px) {
		.about-container {
			margin: 20px;
			padding: 20px;
		}
		.title {
			font-size: 2em;
		}
		h2 {
			font-size: 1.3em;
		}
		li {
			padding-left: 15px;
		}
		li::before {
			left: 10px;
		}
	}
</style>
