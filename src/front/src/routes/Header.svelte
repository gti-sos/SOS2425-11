<script>
    let menuItems = [
        { name: "Inicio", link: "/" },
        { name: "Front ALM", link: "/ALM" },
        { name: "Front EBT", link: "/EBT" },
        { name: "About", link: "/about" }
    ];
</script>

<nav class="header-nav">
    <ul>
        {#each menuItems as item}
            <li><a href={item.link}>{item.name}</a></li>
        {/each}
    </ul>
</nav>

<style>
    .header-nav {
        /* Gradient background */
        background: linear-gradient(to right, #6a82fb, #fc5c7d);
        padding: 1rem 2rem; /* Adjusted padding */
        width: 100%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Softer, more pronounced shadow */
        box-sizing: border-box; /* Ensure padding is included in width */
    }

    .header-nav ul {
        list-style: none;
        display: flex;
        gap: 2rem; /* Increased gap for better spacing */
        margin: 0;
        padding: 0;
        justify-content: center;
        align-items: center; /* Vertically align items */
    }

    .header-nav li {
        position: relative; /* For potential pseudo-elements */
    }

    .header-nav a {
        color: #ffffff; /* White text for contrast */
        text-decoration: none;
        font-weight: 600; /* Slightly bolder */
        padding: 0.6rem 1.2rem; /* Padding for a larger clickable area */
        border-radius: 8px; /* Rounded corners */
        transition: background-color 0.3s ease, transform 0.2s ease, color 0.3s ease; /* Smooth transitions */
        display: inline-block; /* Apply padding correctly */
        position: relative; /* For pseudo-elements */
        overflow: hidden; /* Hide overflow for effects */
    }

    .header-nav a::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%; /* Start outside */
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.2); /* Lighter overlay */
        transition: left 0.3s ease; /* Slide-in effect */
        z-index: 0;
        border-radius: 8px;
    }

    .header-nav a:hover::before {
        left: 0; /* Slide in on hover */
    }

    .header-nav a:hover {
        /* Optional: slightly lift the button */
        /* transform: translateY(-2px); */
        color: #f0f0f0; /* Slightly dimmer white on hover */
        text-decoration: none; /* Ensure no underline */
    }

    /* Keep text above the pseudo-element */
    .header-nav a span {
        position: relative;
        z-index: 1;
    }

    /* Add span inside the link in the template if using the above */
    /* Example: <li><a href={item.link}><span>{item.name}</span></a></li> */
    /* For simplicity, we'll skip the span and rely on text color change */

</style>