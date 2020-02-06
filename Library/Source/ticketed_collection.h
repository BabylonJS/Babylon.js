#pragma once

#include <map>

namespace Babylon
{
    // NOTE: This type is not thread-safe.
    template<typename T>
    class ticketed_collection
    {
        // NOTE: Philosophically, this type is actually std::map<MapT**, T>.
        // That's a recursive type, though, so for simplicity's sake we use
        // void instead of MapT in the definition here.
        using MapT = std::map<void**, T>;

    public:
        class ticket
        {
        public:
            ticket(const ticket&) = delete;

            ticket(ticket&& other)
                : m_collection{ other.m_collection }
            {
                other.m_collection = nullptr;
            }

            ~ticket()
            {
                // If m_collection itself is a nullptr, then the object being
                // destructed is the "empty shell" left over after the use of 
                // a move constructor has been used to logically move the 
                // ticket. In this case, there's nothing the destructor needs
                // to do, so early-out.
                if (m_collection == nullptr)
                {
                    return;
                }

                MapT* ptr = *m_collection;
                if (ptr != nullptr)
                {
                    ptr->erase(reinterpret_cast<void**>(m_collection));
                }

                delete m_collection;
            }

        private:
            friend class ticketed_collection;

            ticket(T&& value, MapT& collection)
                : m_collection{ new MapT*(&collection) }
            {
                collection[reinterpret_cast<void**>(m_collection)] = std::move(value);
            }

            MapT** m_collection;
        };

        ticketed_collection() = default;
        ticketed_collection(const ticketed_collection&) = delete;
        ticketed_collection(ticketed_collection&&) = delete;

        ~ticketed_collection()
        {
            clear();
        }

        ticket insert(T&& value)
        {
            return{ std::move(value), m_map };
        }

        template<typename CallableT>
        void apply_to_all(CallableT callable)
        {
            for (auto& [ptr, value] : m_map)
            {
                callable(value);
            }
        }

        void clear()
        {
            for (auto& [ptr, value] : m_map)
            {
                *ptr = nullptr;
            }

            m_map.clear();
        }

    private:
        MapT m_map{};
    };
}
