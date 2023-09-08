function chunkArray(array, chunkSize) {
    return array.reduce((rows, item, i) => {
        if (i % chunkSize === 0) rows.push([item]);
        else rows[rows.length - 1].push(item);
        return rows;
      }, []);
}

module.exports = { chunkArray };