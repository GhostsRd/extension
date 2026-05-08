chrome.history.search({ text: "", maxResults: 10 }, function(results) {
  const list = document.getElementById("list");

  results.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.url}" target="_blank">${item.title || item.url}</a>`;
    list.appendChild(li);
  });
});