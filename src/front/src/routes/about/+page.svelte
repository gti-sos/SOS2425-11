<script>
    import Header from '../Header.svelte';
</script>
<Header />

<svelte:head>
    <title>SOS2425-11 - About</title>
    <meta name="description" content="About the SOS2425-11 project and team" />
</svelte:head>

<div class="about-container">
    <h1>SOS2425-11</h1>
    <ul>
        <li><strong>Team</strong>
            <ul>
                <li>Eduardo Becerra Tomé (<a href="https://github.com/edubectom" target="_blank" rel="noopener noreferrer">https://github.com/edubectom</a>)</li>
                <li>Mario Tur Pantión (<a href="https://github.com/mariotuur" target="_blank" rel="noopener noreferrer">https://github.com/mariotuur</a>)</li>
                <li>Antonio Manuel Luque Molina (<a href="https://github.com/antluqmol1" target="_blank" rel="noopener noreferrer">https://github.com/antluqmol1</a>)</li>
            </ul>
        </li>
        <li><strong>Project description:</strong> Our information sources focus on analyzing the evolution of aid for dependent individuals in Spain, examining key aspects such as social and economic support systems.</li>
        <li><strong>Repository:</strong> <a href="https://github.com/gti-sos/SOS2425-11" target="_blank" rel="noopener noreferrer">gti-sos/SOS2425-11</a></li>
        <li><strong>URL:</strong> <a href="https://sos2425-11.onrender.com/" target="_blank" rel="noopener noreferrer">https://sos2425-11.onrender.com/</a></li>
        <li><strong>APIs:</strong>
            <ul>
                <li><a href="https://sos2425-11.onrender.com/api/v1/autonomy-dependence-applications/docs" target="_blank" rel="noopener noreferrer">/api/v1/autonomy-dependence-applications/docs</a> (developed by Antonio Manuel Luque Molina)</li>
                <li><a href="https://sos2425-11.onrender.com/api/v1/social-pension-payrolls/docs" target="_blank" rel="noopener noreferrer">/api/v1/social-pension-payrolls/docs</a> (developed by Eduardo Becerra Tomé)</li>
                <li><a href="https://sos2425-11.onrender.com/api/v1/management-evolutions/docs" target="_blank" rel="noopener noreferrer">/api/v1/management-evolutions/docs</a> (developed by Mario Tur Pantión)</li>
            </ul>
        </li>
    </ul>
    <a href="/">Volver</a>
</div>

<style>
    .about-container {
        font-family: Arial, sans-serif;
        margin: 20px;
        line-height: 1.6;
    }

    h1 {
        border-bottom: 2px solid #ccc;
        padding-bottom: 5px;
    }

    ul {
        list-style-type: disc;
        margin-left: 20px;
        padding-left: 20px; /* Added padding for better indentation */
    }

    li {
        margin-bottom: 10px; /* Added margin for spacing */
    }

    a {
        color: #007bff;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>