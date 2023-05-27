/**
 * Define types for the objects related with configuring the server
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

/**
 * Interface to define ConfigObj object
 * This type of object will given to the constructor of ServerConfig
 */
export interface ConfigObj {
  db: DbObj; // contain database configuration parameters
  expressPort: number; // indicate express server port
  webpageOrigin: string; // indicate our website Origin
  applicationKey: string[]; // Indicate the list of applicationKey (Mobile Application Origin Check)
}

/**
 * Interface to define DbObj object
 * This type of object should be contained in the ConfigObj
 */
export interface DbObj {
  endpoint: string; // URL indicating the location of database server and port
  key: string;
  databaseId: string; // default database name
}
