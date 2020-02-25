#pragma once

#include <map>

namespace Babylon
{
    // NOTE: This type is not thread-safe.
    template<typename T>
    class TicketedCollection
    {
        // NOTE: Philosophically, this type is actually std::map<MapT**, T>.
        // That's a recursive type, though, so for simplicity's sake we use
        // void instead of MapT in the definition here.
        using MapT = std::map<void**, T>;

    public:
        class Ticket
        {
        public:
            Ticket(const Ticket&) = delete;

            Ticket(Ticket&& other)
                : m_collection{ other.m_collection }
            {
                other.m_collection = nullptr;
            }

            ~Ticket()
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
            friend class TicketedCollection;

            Ticket(T&& value, MapT& collection)
                : m_collection{ new MapT*(&collection) }
            {
                collection[reinterpret_cast<void**>(m_collection)] = std::move(value);
            }

            MapT** m_collection;
        };

        TicketedCollection() = default;
        TicketedCollection(const TicketedCollection&) = delete;
        TicketedCollection(TicketedCollection&&) = delete;

        ~TicketedCollection()
        {
            Clear();
        }

        Ticket Insert(T&& value)
        {
            return{ std::move(value), m_map };
        }

        template<typename CallableT>
        void ApplyToAll(CallableT callable)
        {
            for (auto& [ptr, value] : m_map)
            {
                callable(value);
            }
        }

        void Clear()
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
