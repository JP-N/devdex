document.addEventListener('DOMContentLoaded', () => {

    const incrementButtons = document.querySelectorAll('.increment-btn');

    incrementButtons.forEach(button => {

        button.addEventListener('click', async () => {

            const entryId = button.getAttribute('data-id');

            try {

                const response = await fetch(`/increment-value/${entryId}`, { method: 'POST' });

            } catch (error) {

                console.error('Error:', error);
            }
        });
    });
});
