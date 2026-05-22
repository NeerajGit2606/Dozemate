import {IoSearch} from "react-icons/io5"


const SearchBox = () => {

    return(
        <div className="position-relative d-flex align-items-center searchBox">
           <IoSearch className="mr-2"/>
            <input type="text" placeholder="Search"/>


        </div>
    )

}
export default SearchBox;