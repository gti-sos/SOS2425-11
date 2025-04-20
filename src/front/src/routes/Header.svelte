<script>
    let menuItems = [
        { name: "Inicio", link: "/" },
        { name: "Api ALM", link: "/ALM" },
        { name: "About", link: "/about" },
        { name: "Contacto", link: "/contact" }
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
        background-color: #a8b7fb; /* Color claro */
        padding: 1rem;
        width: 100%; /* Adaptar al ancho de la pantalla */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Sombra ligera */
    }

    .header-nav ul {
        list-style: none;
        display: flex;
        gap: 1rem;
        margin: 0;
        padding: 0;
        justify-content: center; /* Centrar los elementos */
    }

    .header-nav a {
        color: #333; /* Texto oscuro */
        text-decoration: none;
        font-weight: bold;
    }

    .header-nav a:hover {
        text-decoration: underline;
    }
</style>