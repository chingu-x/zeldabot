const fs = require('fs');

class FileOps {

	/**
	 * Open the file for appending. The file will be created if it 
	 * doesn't already exist.
	 * @param {String} filePath Full path name of the file
	 * @returns {Number} File Descriptor number
	 * @memberof FileOps
	 */
	static openAndAppendFile(filePath) {
		return fs.openSync(filePath, 'a+');
	}

	/**
	 * Open and clear the contents of a file. The file will be created if it 
	 * doesn't already exist.
	 * @param {String} filePath Full path name of the file
	 * @returns {Number} File Descriptor number
	 * @memberof FileOps
	 */
	static openAndClearFile(filePath) {
		return fs.openSync(filePath, 'w+');
	}

	/**
	 * Close a file
	 * @static
	 * @param {*} fd File descriptor number
	 * @memberof FileOps
	 */
	static closeFile(fd) {
		fs.closeSync(fd);
	}

	/**
	 * Read the contents of a file
	 * @param {String} pathToFile Fully qualified path to the file
	 * @returns {String} File contents
	 * @memberof FileOps
	 */
	static readFile(pathToFile) {
		return fs.readFileSync(pathToFile);
	}

	/**
	 * Write the contents of an object array to a file.
	 * @param {String} filePath Full path name of the output file
	 * @param {[String]} content Content to write
	 * @returns {Promise} Promise resolved when file write is completed
	 * @memberof FileOps
	 */
	static objectToFile(filePath, content) {
		return new Promise((resolve, reject) => {
			const file = fs.createWriteStream(filePath);
			for (const row of content) {
				file.write(row+'\n');
			}
			file.end();
			file.on('finish', () => {
				resolve('File write completed');
			});
		})
	}

	/**
	 * Write to a file
	 * @static
	 * @param {String} filePath Path to the file
	 * @param {String} record Record to add
	 * @returns {Promise} Promise to be resolved when the write completes
	 * @memberof FileOps
	 */
	static writeToFile(filePath, record) {
		return new Promise((resolve, reject) => {
			const file = fs.createWriteStream(filePath);
			file.write(record+'\n');
			file.end();
			file.on('finish', () => {
				resolve('File write completed');
			});
		})
	}

	/**
	 * Validate that the path exists and is a directory
	 * @static
	 * @param {String} pathToDir Path specification
	 * @returns {Number} 0: Directory exists; -1: Not found or inaccessible; -2: Not a directory
	 * @memberof FileOps
	 */
	static validateDirPath(pathToDir) {
		try {
			const pathStat = fs.statSync(pathToDir);
			if (!pathStat.isDirectory()) {
				return -2; // Not a directory
			}
			return 0; // Path is a valid directory
		}
		catch(err) {
			return -1; // Not found or inaccessible
		}
	}
}

module.exports = FileOps;