document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById('search-input');
    const baseUrl = document.getElementById('search').dataset.baseurl;
    let resultsContainer;
    const maxResults = 10;

    fetch(`${baseUrl}/search_index.json`)
        .then(response => response.json())
        .then(searchIndex => {
            // Function to calculate TF-IDF score
            function calculateTfIdf(query, item) {
                const queryTerms = query.toLowerCase().split(' ');
                let score = 0;

                queryTerms.forEach(term => {
                    const termFrequency = Object.keys(item.keywords).reduce((acc, keyword) => {
                        if (keyword.startsWith(term)) {
                            acc += item.keywords[keyword];
                        }
                        return acc;
                    }, 0);
                    
                    const inverseDocumentFrequency = Math.log(searchIndex.length / searchIndex.filter(i => Object.keys(i.keywords).some(keyword => keyword.startsWith(term))).length);
                    score += termFrequency * inverseDocumentFrequency;
                });

                return score;
            }

            // Function to decode HTML entities
            function decodeHtml(html) {
                return new DOMParser().parseFromString(html, 'text/html').documentElement.textContent;
            }

            // Function to perform the search
            function performSearch(query) {
                query = query.toLowerCase();
                const results = searchIndex.map(item => ({
                    ...item,
                    score: calculateTfIdf(query, item)
                }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, maxResults);

                displayResults(results);
            }

            // Function to display results
            function displayResults(results) {
                if (!resultsContainer) {
                    resultsContainer = document.createElement('div');
                    resultsContainer.id = 'search-results';
                    searchInput.parentNode.appendChild(resultsContainer);
                }
                resultsContainer.innerHTML = '';
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<p>No results found.</p>';
                    return;
                }

                const ul = document.createElement('ul');
                results.forEach(item => {
                    const li = document.createElement('li');

                    // Post metadata
                    const span = document.createElement('span');
                    span.className = 'post-meta';
                    span.textContent = item.date;

                    if (item.tags && item.tags.length > 0) {
                        span.textContent += ' • ';
                        const tagsSpan = document.createElement('span');
                        tagsSpan.className = 'tags';
                        item.tags.forEach(tag => {
                            const tagLink = document.createElement('a');
                            tagLink.href = `${baseUrl}/tags/${tag.toLowerCase()}/`;
                            tagLink.textContent = '# ' + tag.toLowerCase();
                            tagsSpan.appendChild(tagLink);
                        });
                        span.appendChild(tagsSpan);
                    }

                    li.appendChild(span);

                    // Post title
                    const a = document.createElement('a');
                    a.className = 'post-link';
                    a.href = item.url;
                    a.textContent = decodeHtml(item.title);
                    li.appendChild(a);

                    // Post excerpt
                    const p = document.createElement('p');
                    p.textContent = decodeHtml(item.excerpt);
                    li.appendChild(p);

                    ul.appendChild(li);
                });

                resultsContainer.appendChild(ul);
            }

            // Event listener for search input
            searchInput.addEventListener('input', function() {
                performSearch(this.value);
            });

            // Trigger initial search if search input has value
            if (searchInput.value.trim() !== '') {
                performSearch(searchInput.value);
            }
        })
        .catch(error => console.error('Error loading JSON:', error));
});
